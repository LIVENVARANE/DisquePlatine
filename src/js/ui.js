const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const fs = require('fs');

function pageLoad() {
    refreshStreamCount();
}

document.addEventListener('DOMContentLoaded', function() {
    pageLoad();
});

function presentWizard() {
    document.getElementById('wizard').style.zIndex = '10';
    document.getElementById('w-header').style.opacity = 1;
    document.getElementById('w-header').style.marginTop = '20px';
}

function cleanWizard() {
    document.getElementById('w-token').value = '';
    document.getElementById('w-track').value = '';
    document.getElementById('wizard').style.zIndex = '-100';
    document.getElementById('w-header').removeAttribute('style');
}

async function addBayFromWizard() {
    var bayNumber = getNumberOfBays() + 1;
    var bearer = document.getElementById('w-token').value;
    var trackURL = document.getElementById('w-track').value;
    if(trackURL == '') trackURL = defaultTrack;

    var bay = document.createElement('li');
    bay.setAttribute('number', bayNumber);
    bay.setAttribute('bearer', bearer);
    bay.innerHTML = '<h5>Interface n°' + bayNumber + '</h5><h6>État: <span id="bay-' + bayNumber + '">Acquisition d\'un proxy...</span><a class="close unavailable">Fermer l\'interface</a><i title="Bearer ' + bearer + '" class="fas fa-info-circle"></i><i class="far fa-eye unavailable"></i>';
    document.getElementById('bays').appendChild(bay);
    var proxyToUse = await getRandomProxy();
    document.getElementById('bay-' + bayNumber).innerHTML = 'Chargement...';

    ipcRenderer.send('startBay', { number: bayNumber, auth: bearer, track: trackURL, proxy: proxyToUse });

    cleanWizard();
}

function presentDefaultManager() {
    document.getElementById('default-manager').style.zIndex = '10';
    document.getElementById('dm-header').style.opacity = 1;
    document.getElementById('dm-header').style.marginTop = '20px';
}

function changeDefaultTrackFromDefaultManager() {
    defaultTrack = document.getElementById('dm-track').value;
    document.getElementById('default-track-button').innerHTML = 'Modifier le morceau par défaut';
    closeDefaultManager();
}

function closeDefaultManager() {
    document.getElementById('default-manager').style.zIndex = '-100';
    document.getElementById('dm-header').removeAttribute('style');
}

function displayAlert(message) {
    document.getElementById('alert').innerText = message;

    document.getElementById('alert-wrapper').style.display = 'block';
}