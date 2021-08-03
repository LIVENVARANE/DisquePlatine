var accountInfo = {};

var errorStop = false;

var bayBG = document.createElement('div');
bayBG.id = 'dp-bay-background';
bayBG.innerHTML = '<h5>Connecté au compte: <span id="account-name">Chargement...</span></h5><h6>Ouvrez les devTools pour controller l\'interface.</h6><a style="color: #5991f7; cursor: pointer;" id="a-close-dp-pop">Cliquez ici pour accéder au lecteur</a>';
bayBG.style.backgroundColor = 'white';
bayBG.style.position = 'fixed';
bayBG.style.width = '100%';
bayBG.style.height = '100%';
bayBG.style.top = '0px';
bayBG.style.left = '0px';

document.body.appendChild(bayBG);

var authMeta = document.createElement('meta');
authMeta.id = 'bearer';
authMeta.name = 'authentification';
authMeta.content = '';

var trackMeta = document.createElement('meta');
trackMeta.id = 'track';
trackMeta.name = 'track';
trackMeta.content = '';

document.head.appendChild(authMeta);
document.head.appendChild(trackMeta);

document.getElementById('a-close-dp-pop').addEventListener('click', function() {
    document.getElementById('dp-bay-background').style.display = 'none';
})

function loadBay() {
    var bearer = document.getElementById('bearer').getAttribute('content');

    setTimeout(function() {
        if(errorStop) {
            var logoPresent = false;
            document.querySelectorAll('.logo').forEach(function() {
                logoPresent = true;
            });
            if(logoPresent) {
                ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Connexion au lecteur...<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');
            } else {
                ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "RESTART/' + bearer + '", windowCanBeOpened: false, bayCanBeClosed: true, track: "' + document.getElementById('track').getAttribute('content') + '" })');
            }
        }
    }, 20000);

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
            errorStop = true;
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