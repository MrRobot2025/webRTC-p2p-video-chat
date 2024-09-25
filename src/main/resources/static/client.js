const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;
let peerConnection;

const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const conn = new WebSocket('ws://localhost:8001/socket');

conn.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    switch (data.event) {
        case 'offer':
            await handleOffer(data.data);
            break;
        case 'answer':
            await handleAnswer(data.data);
            break;
        case 'candidate':
            await handleCandidate(data.data);
            break;
    }
};

async function startVideoChat() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            send({ event: 'candidate', data: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    send({ event: 'offer', data: offer });
}

function send(message) {
    conn.send(JSON.stringify(message));
}

async function handleOffer(offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    send({ event: 'answer', data: answer });
}

async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleCandidate(candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Start the video chat when ready
startVideoChat();
