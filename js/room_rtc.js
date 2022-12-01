const APP_ID = "2ad62e8c57824ad289fd42d97ffc2d0b"

let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000))
    sessionStorage.setItem('uid',uid)
}

let token = null;
let client;

let rtmClient;
let channel;

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if(!roomId){
    roomId = 'main'
}

let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'index.html'
}
let localTracks = []
let remoteUsers = {}

// create rooms
let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined',handleMemberJoined)

    client = AgoraRTC.createClient({mode:'rtc',codec:'vp8'})
    await client.join(APP_ID,roomId,token,uid)

    client.on('user-published',handleUserPublished)
    client.on('user-left', handleUserLeft)
    joinStream()
}

// Ask user to enable camera and microphone
let joinStream = async () =>{

    // document.getElementById('join-btn').style.display = 'none'
    // document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()
    // High Resolution
    // {},{encoderConfig:{
    //     width:{min:640,ideal:1920,max:1920},
    //     height:{min:480,ideal:1080,max:1080}
    // }}
    let player = `<div class="video__container" id="user-container-${uid}">
    <div class="video-player" id="user-${uid}"></div>
    </div>`
    document.getElementById('streams__container').insertAdjacentHTML('beforeend',player)
    document.getElementById(`user-container-${uid}`).addEventListener('click',expandVideoFrame)
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0],localTracks[1]])
}

let handleUserPublished = async (user,mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user,mediaType)
    let player = document.getElementById(`user-container-${user.uid}`)
    if (player === null){
    player = `<div class="video__container" id="user-container-${user.uid}">
    <div class="video-player" id="user-${user.uid}"></div>
    </div>`
    document.getElementById('streams__container').insertAdjacentHTML('beforeend',player)
    document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
    }

    if(displayFrame.style.display){
        let videoFrames = document.getElementById(`user-container-${usre.uid}`)
        videoFrames.style.height = "100px"
        videoFrames.style.width = "100px"
    }
    if (mediaType === "video"){
        user.videoTrack.play(`user-${user.uid}`)
    }
    if (mediaType === "audio"){
        user.audioTrack.play()
    }
}
let handleUserLeft = async (user) => {
    delete remoteUsers[user.id]
    document.getElementById(`user-container-${user.uid}`).remove()

    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null

        let videoFrames = document.getElementsByClassName('video__container')

        for(let i =0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget

    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}
let toggleMic = async (e) => {
    let button = e.currentTarget

    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

// let leaveStream = async (e) => {
//     e.preventDefault()
//     document.getElementById('join-btn').style.display = 'block'
//     document.getElementsByClassName('stream__actions')[0].style.display = 'none'

//     for(let i = 0; localTracks.length > i; i++ ){
//         localTracks[i].stop()
//         localTracks[i].close()
//     }
//     await client.unpublish([localTracks[0],localTracks[1]])

//     document.getElementById(`user-container-${uid}`).remove()

// }

let leaveStream = async (e) => {
    e.preventDefault()

    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.unpublish([localTracks[0], localTracks[1]])

    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }

    document.getElementById(`user-container-${uid}`).remove()

    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }

    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}

document.getElementById('camera-btn').addEventListener('click',toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('leave-btn').addEventListener('click', leaveStream)
// document.get('join-btn').addEventListener('click',joinStream)
joinRoomInit()
//