console.log('Loaded bay.js');

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
bayBG.style.zIndex = '1000';

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

var bearer;
var track;

function loadBay() {
    bearer = document.getElementById('bearer').getAttribute('content');
    track = document.getElementById('track').getAttribute('content');

    setTimeout(async function() {
        if(!errorStop) {
            var logoPresent = false;
            document.querySelectorAll('.logo').forEach(function() {
                logoPresent = true;
            });
            
            if(logoPresent) {
                ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Connexion au lecteur...<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');
                var accountButtonPresent = false;
                document.querySelectorAll('button[data-testid=user-widget-link]').forEach(function() {
                    accountButtonPresent = true;
                });
                if(accountButtonPresent) {
                    ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Lancement du morceau...<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');
                    var result = await playSong(track);
                    ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "En fonctionnement<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');

                    //if(result) startSongMaintainer();
                } else {
                    console.log('err loadBay()');
                }
            } else {
                ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "RESTART/' + bearer + '", windowCanBeOpened: false, bayCanBeClosed: true, track: "' + track + '" })');
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
            throw 'DeniedTokenError: Le token Bearer a été refusé par Spotify, il est probablement invalide.'; 
        }

        console.log('Connnecté au compte: ' + JSON.parse(xhr.responseText)['display_name'] + ', variable informations de compte disponible.');
        document.getElementById('account-name').innerHTML = JSON.parse(xhr.responseText)['display_name'];
        accountInfo = JSON.parse(xhr.responseText);
        ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Connecté à Spotify, lancement du lecteur...<br>Compte: ' + JSON.parse(xhr.responseText)['display_name'] + '", windowCanBeOpened: true, bayCanBeClosed: true })');
        //startTrack(bearer, track);
    }};

    xhr.send();
}

function playSong(song) { //404
    return new Promise(resolve => {
        var url = "https://gew-spclient.spotify.com/connect-state/v1/player/command/from/1123fa5b957d428c08342ed5da0c725f06a1717f/to/" + deviceId;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        xhr.setRequestHeader("accept", "*/*");
        xhr.setRequestHeader("accept-language", "en-US,en;q=0.5");
        xhr.setRequestHeader("authorization", bearer);

        xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if(xhr.status == 401) { //wrong bearer
                ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Erreur: Mauvais token", windowCanBeOpened: true, bayCanBeClosed: true })');
                resolve(false);
            } else {
                resolve(true);
            }
        }};

        var data = '{"command":{"context":{"uri":"spotify:track:7sERRcLfvBFcRd9bAr6edd","url":"context://spotify:track:7sERRcLfvBFcRd9bAr6edd","metadata":{}},"play_origin":{"feature_identifier":"search","feature_version":"web-player_2021-08-06_1628285655954_955a21e","referrer_identifier":"search"},"options":{"license":"on-demand","skip_to":{},"player_options_override":{}},"endpoint":"play"}}';

        xhr.send(data);
    });
}

function resumeSong() {
    var url = "https://gew-spclient.spotify.com/track-playback/v1/devices/" + deviceId + "/state";

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url);

    xhr.setRequestHeader("authorization", bearer);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.setRequestHeader("accept", "*/*");
    xhr.setRequestHeader("accept-language", "en-US,en;q=0.9,fr;q=0.8,fr-FR;q=0.7,en-GB;q=0.6");

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        if(xhr.status == 401) { //wrong bearer
            ipcRenderer.send('hostJS', 'updateBayState(' + bayNumber + ',  { state: "Erreur: Mauvais token", windowCanBeOpened: true, bayCanBeClosed: true })');
        }
    }};

    var data = '{"seq_num":1628288835730,"state_ref":{"state_machine_id":"' + deviceId + '","state_id":"ac511c2a659561c3fe000a379683d1c5","paused":false},"sub_state":{"playback_speed":1,"position":1835,"duration":120791,"media_type":"AUDIO","bitrate":128000,"audio_quality":"HIGH","format":10},"previous_position":1835,"debug_source":"resume"}';

    xhr.send(data);

}

function startSongMaintainer() {
    console.log('Démarrage des analyses récurrentes');

    setInterval(function() {
        var paused = false;
        document.querySelectorAll('button[data-testid=control-button-play]').forEach(function() {
            paused = true;
        });
        if(paused) {
            resumeSong(track);
            console.log('Morceau en pause, redémarrage.');
        };
    }, 15000);
    
    setInterval(function() {
        var timestamp = null;
        document.querySelectorAll('div[data-testid=playback-position]').forEach(function(element) {
            timestamp = element.innerText;
        });

        if(timestamp == null) {
            resumeSong();
            console.log('État du morceau inconnu, redémarrage.');
        } 

        if(parseInt(timestamp.split(':')[1]) >= 40 || parseInt(timestamp.split(':')[0]) >= 1) {
            console.log('40 secondes de lecture dépassées, redémarrage du morceau');
                playSong(track);
        }
    }, 40000);
}