import React, {useEffect, useRef, useState} from 'react';

const MediaStream = () => {
    const [socket, setSocket] = useState(null);
    const [peerConnections, setPeerConnections] = useState({});
    const localAudioRef = useRef(null);
    const remoteAudioRefs = useRef({});

    useEffect(() => {
        const newSocket = new WebSocket('ws://localhost:8080/signal');

        newSocket.onopen = () => {
            console.log('WebSocket connection opened');
            setSocket(newSocket);
        };

        newSocket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.from) {
                setPeerConnections(prevPeerConnections => {
                    let pc = prevPeerConnections[data.from];
                    if (!pc) {
                        pc = createPeerConnection(data.from);
                        prevPeerConnections[data.from] = pc;
                    }
                    handleSignalingData(data, pc);
                    return { ...prevPeerConnections };
                });
            }
        };

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                localAudioRef.current.srcObject = stream;
                localAudioRef.current.play();

                Object.values(peerConnections).forEach(pc => {
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track, stream);
                    });
                });
            })
            .catch(error => {
                console.error('Error accessing media devices.', error);
            });

    }, [peerConnections]);

    const createPeerConnection = (id) => {
        const pc = new RTCPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage({
                    type: 'candidate',
                    candidate: event.candidate,
                    to: id
                });
            }
        };

        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (!remoteAudioRefs.current[id]) {
                remoteAudioRefs.current[id] = React.createRef();
                remoteAudioRefs.current[id].current.srcObject = remoteStream;
                remoteAudioRefs.current[id].current.play();
            }
        };

        return pc;
    };

    const sendMessage = (message) => {
        socket.send(JSON.stringify(message));
    };

    const handleSignalingData = (data, pc) => {
        switch (data.type) {
            case 'offer':
                pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                pc.createAnswer().then(answer => {
                    pc.setLocalDescription(answer);
                    sendMessage({ type: 'answer', answer: answer, to: data.from });
                });
                break;
            case 'answer':
                pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                break;
            case 'candidate':
                pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                break;
            default:
                break;
        }
    };

    return (
        <div>
            <h1>WebRTC SFU Signaling</h1>
            <audio ref={localAudioRef} controls />
            {Object.keys(remoteAudioRefs.current).map(key => (
                <audio key={key} ref={remoteAudioRefs.current[key]} controls />
            ))}
        </div>
    );
}

export default MediaStream
