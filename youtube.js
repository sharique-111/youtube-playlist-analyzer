const puppeteer = require("puppeteer");
const pdf = require("pdfkit");
const fs = require("fs");
let playListLink = "https://youtube.com/playlist?list=PL-Jc9J83PIiEeD3I4VXETPDmzJ3Z1rWb4";
let cTab;
(async function (){
    try {
        let browserOpen = puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        })
        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        cTab = allTabsArr[0];
        await cTab.goto(playListLink);
        await cTab.waitForSelector("h1#title");
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText},"h1#title");
        // console.log(name);
        let Alldata = await cTab.evaluate(getData,"#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");
        console.log(name,Alldata.noOfVideos,Alldata.noOfViews);
        let totalVideos = Alldata.noOfVideos.split(" ")[0];
        console.log(totalVideos);
        let currentVideos = await getCurrentVideosLength();
        console.log(currentVideos);
        while(totalVideos-currentVideos>=20) {
            await scrollToBottom();
            currentVideos = await getCurrentVideosLength();
        }
        let finalList = await getStats();
        // console.log(finalList);
        let pdfdoc = new pdf;
        pdfdoc.pipe(fs.createWriteStream('playlist.pdf'));
        pdfdoc.text(JSON.stringify(finalList));
        pdfdoc.end();
    } catch (error) {
        console.log(error);
    }
})()

function getData(selector){
    let allElements = document.querySelectorAll(selector);
    let noOfVideos = allElements[0].innerText;
    let noOfViews = allElements[1].innerText;

    return{
        noOfVideos,
        noOfViews
    }
}

async function getCurrentVideosLength() {
    let length = await cTab.evaluate(getLength,"#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer")
    return length; 
}

function getLength(durationSelect) {
    let durationElem = document.querySelectorAll(durationSelect);
    return durationElem.length;
}

async function scrollToBottom() {
    await cTab.evaluate(goToBottom)
    function goToBottom(){
        window.scrollBy(0,window.innerHeight);
    }
}
 
async function getStats(){
    let list = cTab.evaluate(getNameAndDuration,"#video-title","#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    return list;
}

function getNameAndDuration(videoSelector,durationSelector){
    let videoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList =[];
    for(let i=0;i<durationElem.length;i++){
        let videotitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({videotitle,duration});
    }
    return currentList;
}