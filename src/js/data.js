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
    //state is a dict

    console.log('updateBayState');
}