import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS.js';


// Initialize map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

// Function to fetch layers from GeoServer
async function fetchLayers() {
  try {
    const response = await fetch('http://localhost:8080/geoserver/rest/workspaces/agis/datastores/repository/featuretypes', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa('admin:geoserver'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const fileDropdown = document.getElementById('file');
    data.featureTypes.featureType.forEach(layer => {
      const option = document.createElement('option');
      option.value = layer.name;
      option.textContent = layer.name;
      fileDropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching layers:', error);
  }
}

// Fetch layers on page load
fetchLayers();

// Function to fetch attributes for selected layer
async function fetchAttributes(layer) {
  try {
    const response = await fetch(`http://localhost:8080/geoserver/rest/workspaces/agis/datastores/repository/featuretypes/${layer}.json`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa('admin:geoserver'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const fieldDropdown = document.getElementById('field');
    fieldDropdown.innerHTML = '';  // Clear previous options
    data.featureType.attributes.attribute.forEach(attr => {
      const option = document.createElement('option');
      option.value = attr.name;
      option.textContent = attr.name;
      fieldDropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
  }
}

// Function to fetch unique values for a selected field
async function fetchFieldValues(layer, field) {
  try {
    const response = await fetch(`http://localhost:8080/geoserver/agis/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${layer}&propertyName=${field}&outputFormat=application/json`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa('admin:geoserver'),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const uniqueValues = [...new Set(data.features.map(feature => feature.properties[field]))];
    const valueDropdown = document.getElementById('value');
    valueDropdown.innerHTML = '';  // Clear previous options
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      valueDropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching field values:', error);
  }
}

// Event listener for file selection
document.getElementById('file').addEventListener('change', (event) => {
  const selectedLayer = event.target.value;
  fetchAttributes(selectedLayer);
});

// Event listener for field selection to populate values
document.getElementById('field').addEventListener('change', (event) => {
  const selectedLayer = document.getElementById('file').value;
  const selectedField = event.target.value;
  fetchFieldValues(selectedLayer, selectedField);
});

// Add field to query textbox on double-click
document.getElementById('field').addEventListener('dblclick', (event) => {
  const selectedField = event.target.value;
  if (selectedField) {
    document.getElementById('query-textbox').value += selectedField + ' ';
  }
});

// Add operator to query textbox on double-click
document.querySelectorAll('#query-operator button').forEach(button => {
  button.addEventListener('dblclick', (event) => {
    document.getElementById('query-textbox').value += event.target.textContent + ' ';
  });
});

// Add value to query textbox on double-click
document.getElementById('value').addEventListener('dblclick', (event) => {
  const selectedValue = event.target.value;
  if (selectedValue) {
    document.getElementById('query-textbox').value += `'${selectedValue}'` + ' ';
  }
});

// Function to execute query and update map layer
function executeQuery() {
  const layer = document.getElementById('file').value;
  const query = document.getElementById('query-textbox').value;
  query
  console.log(query);
  

  // Construct WMS request with CQL_FILTER
  const wmsSource = new TileWMS({
    url: 'http://localhost:8080/geoserver/agis/wms',
    params: {
      'LAYERS': layer,
      'CQL_FILTER': query,
      'TILED': true
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous'
  });

  const wmsLayer = new TileLayer({
    source: wmsSource
  });

  map.addLayer(wmsLayer);
}


// Event listener for select button
document.getElementById('selectButton').addEventListener('click', () => {
  executeQuery();
});

// Event listener for clear button
document.getElementById('clearButton').addEventListener('click', () => {
  document.getElementById('query-textbox').value = '';
});
