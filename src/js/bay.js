const { ipcRenderer } = require('electron');

var accountInfo = {};

function loadBay() {
    var bearer = document.getElementById('bearer').getAttribute('content');

    var url = "https://api.spotify.com/v1/me";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.setRequestHeader("accept", "*/*");
    xhr.setRequestHeader("authorization", bearer);
    xhr.setRequestHeader("accept-language", "en-US,en;q=0.9,fr;q=0.8,fr-FR;q=0.7,en-GB;q=0.6");

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        if(xhr.status == 400 || xhr.status == 401) { //wrong auth
            ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Erreur: Mauvais token", windowCanBeOpened: true, bayCanBeClosed: true })');
            document.getElementById('account-name').innerHTML = 'Erreur: Mauvais token.';
            throw 'RefusedTokenError: Le token Bearer a été refusé par Spotify, il est probablement invalide.'; 
        }

        console.log('Connnecté au compte: ' + JSON.parse(xhr.responseText)['display_name'] + ', variable informations de compte disponible.');
        document.getElementById('account-name').innerHTML = JSON.parse(xhr.responseText)['display_name'];
        accountInfo = JSON.parse(xhr.responseText);
        ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Connecté à Spotify, lancement du lecteur...<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');
        startTrack(bearer)
    }};

    xhr.send();
}

function startTrack(auth) {

}