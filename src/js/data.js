var defaultTrack = null;
var totalBays = 0;

function refreshStreamCount() {
    return; //broken

    var url = "https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A7JbINbtMFHKIv7Wo4Ts8fR%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22d66221ea13998b2f81883c5187d174c8646e4041d67f5b1e103bc262d447e3a0%22%7D%7D";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    
    xhr.setRequestHeader("accept-language", "en");
    xhr.setRequestHeader("authorization", "Bearer BQC2cgOXPpHADtkDOY-OXnLxTsYCkES7W7c10wKMg6hTx_3PXmnDwpEjMz4OaM9_u1hy650jIfg4VKfOtP3LyJRfC8S4eQihjJYoRF31bkTpLP042_7ld6x7KlscQ4dqLNUtqHc_8i2UjJSSH2UyWdD2k5_0pYbaNgxOiu-xCovrIS3xFuJqgeNsGNqTo1YlDHrJHSamOaTHWCGT9AKu2WV17G3gpmtIUklJQv_1NEw_UroQD_W75NAb52dScb71HwDeBnfCqTDbTE8_UViuDsaynWsMbLRpKAHx5uwDdnJ_UDRGD2tUS0Sr");
    xhr.setRequestHeader("content-type", "application/json;charset=UTF-8"); 

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        document.getElementById('streams-counter').innerHTML = JSON.parse(xhr.responseText)['data']['artist']['discography']['topTracks']['items'][0]['track']['playcount'];
    }};

    xhr.send();
}

function getNumberOfBays() {
    var number = -1;
    document.getElementById('bays').querySelectorAll('li').forEach(function() {
        number++;
    });

    return number;
}

function updateBayState(bayNumber, state) {

    document.getElementById('bays').querySelectorAll('li').forEach(async function(bay) {
        if(bay.getAttribute('number') == bayNumber.toString()) {
            if(state['state'] == 'DELETED') {
                document.getElementById('bay-' + bayNumber).parentElement.parentElement.remove();

                return;
            }
            if(state['state'].includes('RESTART/')) { //bay failed to start, restarting another bay
                var newBayNumber = totalBays + 1;
                ipcRenderer.send('closeBay', bayNumber);
                displayAlert('L\'interface n°' + bayNumber + ' n\'a pas réussi a démarrer, elle va être relancée dans l\'interface n°' + newBayNumber);

                var bay = document.createElement('li');
                bay.setAttribute('number', newBayNumber);
                bay.setAttribute('bearer', state['state'].replace('RESTART/', ''));
                bay.innerHTML = '<h5>Interface n°' + newBayNumber + '</h5><h6>État: <span id="bay-' + newBayNumber + '">Acquisition d\'un proxy...</span><a class="close unavailable">Fermer l\'interface</a><i title="Bearer ' + state['state'].replace('RESTART/', '') + '" class="fas fa-info-circle"></i><i class="far fa-eye unavailable"></i>';
                document.getElementById('bays').appendChild(bay);
                var proxyToUse = await getRandomProxy();
                document.getElementById('bay-' + newBayNumber).innerHTML = 'Chargement...';

                ipcRenderer.send('startBay', { number: newBayNumber, auth: state['state'].replace('RESTART/', ''), track: state['track'], proxy: proxyToUse });

                return;
            }

            document.getElementById('bay-' + bayNumber).innerHTML = state['state'];

            if(state['windowCanBeOpened']) {
                bay.querySelector('.fa-eye').classList.remove('unavailable');
                bay.querySelector('.fa-eye').setAttribute('onclick', 'ipcRenderer.send(\'showBay\', ' + bayNumber + ');');
            } else {
                bay.querySelector('.fa-eye').classList.add('unavailable');
                bay.querySelector('.fa-eye').removeAttribute('onclick');
            }

            if(state['bayCanBeClosed']) {
                bay.querySelector('.close').classList.remove('unavailable');
                bay.querySelector('.close').setAttribute('onclick', 'ipcRenderer.send(\'closeBay\', ' + bayNumber + ');');
            } else {
                bay.querySelector('.close').classList.add('unavailable');
                bay.querySelector('.close').removeAttribute('onclick');
            }
        }
    });
}

function getBayDict() {
    ipcRenderer.send('getBayDict');
    ipcRenderer.on('getBayDict', (event, arg) => {
        ipcRenderer.removeAllListeners('getBayDict');
        console.log(arg.dict);
    });
}

function importConfiguration() {
    dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Fichiers de configuration', extensions: ['dpconf'] },
        ],
        title: 'Charger un fichier de configuration',
        buttonLabel: 'Importer la configuration'
    }, function (files) {
        if (files !== undefined) {
            //TODO
        }
    });
}

function exportConfiguration() {
    if(getNumberOfBays() == 0) {
        alert('Il faut au minimum une baie de lancée pour pouvoir exporter la configuration.');
        return;
    }

    var config = {
        bays: {},
        defaultTrack: null
    };

    var i = 0;
    document.getElementById('bays').querySelectorAll('li').forEach(function(bay) {
        if(bay.className.includes('default')) return;

        i++;
        config['bays'][i] = { bearer: bay.getAttribute('bearer') };
    });

    config['defaultTrack'] = defaultTrack;

    var savePath = dialog.showSaveDialog({
        title: 'Exporter la configuration active',
        buttonLabel: 'Exporter la configuration',
        defaultPath: 'config.dpconf',
        filters: [
            { name: 'Fichiers de configuration', extensions: ['dpconf'] },
        ]
    });

    //var configFile = new Blob([JSON.stringify(config)], {type: "text/plain"});
    fs.writeFileSync(savePath, JSON.stringify(config), 'utf-8');
}

var proxies;

function getRandomProxy() {
    console.log("Acquisition d'un proxy...");
    return new Promise(resolve => {
        if(proxies != null ||proxies == []) {
            var preProxy = proxies[Math.floor(Math.random() * proxies.length)].toString();
            proxies.splice(proxies.indexOf(preProxy), 1);
            var proxy = 'socks4://' + preProxy;
            console.log('Proxy trouvé: ' +  proxy);
            resolve(proxy);
        } else {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "https://www.proxy-list.download/api/v1/get?type=socks4");
            
                xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if(xhr.status == 200) {
                        proxies = xhr.responseText.split('\n');
                        var preProxy = proxies[Math.floor(Math.random() * proxies.length)].toString();
                        proxies.splice(proxies.indexOf(preProxy), 1);
                        var proxy = 'socks4://' + preProxy;
                        console.log('Proxy trouvé: ' +  proxy);
                        resolve(proxy);
                    }
                }};
                xhr.send();
            } catch (error) {
                alert("Une erreur est survenue lors de l'obtention d'un proxy, veuillez relancer l'app.");
            }
        }
        
    });
  }