const { ipcRenderer } = require('electron');

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
    document.getElementById('wizard').style.zIndex = '-100';
    document.getElementById('w-header').removeAttribute('style');
}

function addBayFromWizard() {
    var bayNumber = getNumberOfBays() + 1;
    var bearer = document.getElementById('w-token').value;

    var bay = document.createElement('li');
    bay.setAttribute('bearer', bearer);
    bay.innerHTML = '<h5>Interface n°' + bayNumber + '</h5><h6>État: <span id="bay-' + bayNumber + '">Chargement...</span><a class="close unavailable">Fermer l\'interface</a><i title="Bearer ' + bearer + '" class="fas fa-info-circle"></i>';
    document.getElementById('bays').appendChild(bay);

    ipcRenderer.send('startBay', { number: bayNumber, auth: bearer });

    cleanWizard();
}