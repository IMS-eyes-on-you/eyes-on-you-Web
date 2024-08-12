import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import kurentoUtils from 'kurento-utils';
import {useNavigate} from 'react-router-dom';
import FileUploader from './FileUploader'

const SfuStream = ({files}) => {

        const isShareView = useRef(false)
        const shareView = useRef(null)

        class ScreenHandler {
            getCrossBrowserScreenCapture() {
                if (navigator.mediaDevices.getDisplayMedia) {
                    return navigator.mediaDevices.getDisplayMedia({video: true})
                } else {
                    throw new Error("Screen sharing not supported in this browser")
                }
            }


            async start() {
                try {
                    shareView.current = await this.getCrossBrowserScreenCapture()
                } catch (err) {
                    console.log('error getDisplay', err)
                }
                return shareView.current
            }

            end() {
                if (shareView.current) {
                    shareView.current.getTracks().forEach(track => track.stop())
                    shareView.current = null
                }
            }

        }

        const startScreenShare = async () => {
            await screenHandler.start()
            var participant = participants[userId.current]
            var video = participant.getVideoElement()
            participant.setLocalStream(video.srcObject)
            if (shareView.current == null) {
                return;
            }
            video.srcObject = shareView.current

            await participant.rtcPeer.peerConnection.getSenders().forEach(sender => {
                if (sender.track.kind === 'video') {
                    sender.replaceTrack(shareView.current.getVideoTracks()[0])
                }
            })

            shareView.current.getVideoTracks()[0].addEventListener("ended", () => {
                stopScreenShare()
            })

        }

        const stopScreenShare = async () => {
            await screenHandler.end()
            let participant = participants[userId.current]
            let video = participant.getVideoElement()
            video.srcObject = participant.getLocalStream();

            await participant.rtcPeer.peerConnection.getSenders().forEach(sender => {
                if (sender.track.kind === 'video') {
                    sender.replaceTrack(participant.getLocalStream().getVideoTracks()[0])
                }
            })


        }

        const screenShare = async () => {
            if (isShareView.current) {
                await stopScreenShare();
                isShareView.current = true
            } else {
                await startScreenShare()
                isShareView.current = false
            }
        }

        //참가자 클래스
        class Participant {

            constructor(name, host) {
                this.host = host
                this.name = name;
                this.rtcPeer = null;
                this.localStream = null;
                this.container = document.createElement('div');

                this.span = document.createElement('span');
                this.audio = document.createElement('audio');
                this.video = document.createElement('video');

                this.container.appendChild(this.span);
                this.container.appendChild(this.video);
                this.container.appendChild(this.audio);
                if (this.host == this.name) {
                    document.getElementById('participants').appendChild(this.container);
                }
                this.span.appendChild(document.createTextNode(name))

                this.video.id = 'video-' + name;

                this.video.autoplay = true;
                this.video.playsInline = true;
                this.video.width = 500;
                this.video.height = 300;
                this.audio.autoplay = true;
                this.audio.volume = 1;
            }

            setLocalStream(stream) {
                this.localStream = stream;
            };

            getLocalStream() {
                return this.localStream;
            };

            getElement() {
                return this.container;
            };

            getAudioElement() {
                return this.audio;
            };

            getVideoElement() {
                return this.video;
            }

            onIceCandidate(candidate, wp) {
                let message = {
                    id: 'onIceCandidate',
                    candidate: candidate,
                    name: this.name,
                };
                sendMessageToServer(message);
            };

            dispose() {
                if (this.rtcPeer) {
                    this.rtcPeer.dispose();
                }
                if (this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }

            };

            offerToReceiveAudio(error, offerSdp, wp) {
                if (error) return console.error('sdp offer error', error)
                console.log("data: ", this.name)

                let msg = {
                    id: "receiveVideoFrom",
                    sender: this.name,
                    sdpOffer: offerSdp
                };

                sendMessageToServer(msg)
            }


        }

        const screenHandler = new ScreenHandler();
        const navigate = useNavigate();
        const host = useRef(null);
        const userId = useRef('bang')
        const name = useRef('bang')
        const roomId = useRef('bang')
        const roomName = useRef('bang')
        const [isEnter, setIsEnter] = useState(false)
        const [rooms, setRooms] = useState([]);
        let participants = {};
        var utils = require('kurento-utils');
        let origGetUserMedia = null;
        //나중에 kurento server 올릴 떄 주소 찾아야됨
        let turnUrl = "turn:192.168.0.35:3478";
        let turnUser = "user";
        let turnPwd = "password";
        let locationHost = "localhost:8080";
        const ws = useRef(null);
        const useAudio = useRef(true)
        var constraints = {
            audio: true,
            video: {

                width: 500,
                height: 300,
                maxFrameRate: 15,
                minFrameRate: 15,

            },
        }

        const onNewParticipant = (request) => {
            console.log(request.data)
            let newParticipant = request.data;
            receiveAudio(newParticipant);
        };


        const receiveAudio = (sender) => {
            console.log('sender name: ', sender.name)
            console.log(sender.hostName)
            var participant = new Participant(sender.name, sender.hostName);
            participants[sender.name] = participant;
            var video = participant.getVideoElement();
            console.log(participant.getVideoElement())
            var audio = participant.getAudioElement();
            console.log(participant.getAudioElement())

            var options = {
                remoteVideo: video,
                remoteAudio: audio,
                onicecandidate: participant.onIceCandidate.bind(participant),
                configuration: {
                    iceServers: [
                        {
                            urls: turnUrl,
                            username: turnUser,
                            credential: turnPwd
                        }
                    ]
                }
            };

            participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
                if (error) {
                    return console.error(error);
                }
                console.log(participant)
                console.log(participants)
                this.generateOffer(participant.offerToReceiveAudio.bind(participant));

            });
        };

        const onExistingParticipants = (msg) => {
            console.log(name.current + ' registered in room ' + roomName.current);
            var participant = new Participant(name.current, msg.data.hostName);
            participants[name.current] = participant;

            var video = participant.getVideoElement();
            var audio = participant.getAudioElement();

            var options = {
                localVideo: video,
                localAudeo: audio,
                mediaConstraints: constraints,
                onicecandidate: participant.onIceCandidate.bind(participant),
                configuration: {
                    iceServers: [
                        {
                            urls: turnUrl,
                            username: turnUser,
                            credential: turnPwd
                        }
                    ]
                }
            };

            participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
                if (error) {
                    return console.error(error);
                }
                this.generateOffer(participant.offerToReceiveAudio.bind(participant));

            });
            msg.data.forEach(receiveAudio);
        };

        const onParticipantLeft = (message) => {
            var participant = participants[message.name]
            participant.dispose()
            delete participants[message.name];
        }

        const leftUser = () => {
            sendMessageToServer({
                id: 'leaveRoom'
            })

            for (let key in participants) {
                if (participants.hasOwnProperty(key)) {
                    participants[key].dispose();
                }
            }
            if (ws.current) {
                ws.current.close();
            }

            updateRooms()
        }

        const audioSetting = (name) => {
            let audioTrack = participants[name].rtcPeer.getLocalStream().getTracks().filter(track => track.kind === 'audio')[0];
            if (useAudio.current) {
                useAudio.current = false;
                audioTrack.enabled = false;
            } else {
                useAudio.current = true;
                audioTrack.enabled = true
            }
        }

        useEffect(() => {
            console.log("호출")
            // eslint-disable-next-line no-restricted-globals
            const params = new URLSearchParams(location.search)
            if(params.has('oauth')){
                localStorage.setItem('accessToken', params.get('accessToken'))
                localStorage.setItem('userId', params.get('userId'))
            }
            updateRooms()
        }, [])

        useEffect(() => {
            if (isEnter) {
                ws.current = new WebSocket('ws://' + locationHost + '/signal');
                ws.current.onopen = () => {
                    register();
                };

                ws.current.onmessage = (message) => {
                    var parsedMessage = JSON.parse(message.data);

                    switch (parsedMessage.id) {
                        case 'existingParticipants':
                            console.log("existingparticipants", parsedMessage)
                            onExistingParticipants(parsedMessage);
                            break;
                        case 'newParticipantArrived':
                            console.log("newParticipantArrived", parsedMessage)
                            onNewParticipant(parsedMessage);
                            break;
                        case 'iceCandidate':
                            participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate);
                            break;
                        case 'receiveVideoAnswer':
                            console.log("receiveVideoAnswer", parsedMessage)
                            receiveVideoResponse(parsedMessage);
                            break;
                        case 'participantLeft':
                            console.log("participantLeft", parsedMessage)
                            onParticipantLeft(parsedMessage)
                            break;
                        case 'hostExit':
                            console.log("hostExit", parsedMessage)
                            exit()
                            break;
                        default:
                            console.error(parsedMessage);
                            break;
                    }
                };

                navigator.mediaDevices.getUserMedia(constraints)
                    .then(stream => {
                        constraints.audio = true
                        // Add your logic after successfully getting the media here.
                        constraints.video = {
                            width: 500,
                            height: 300,
                            maxFrameRate: 15,
                            minFrameRate: 15,
                        };
                    });
                if (host.current) {
                    screenShare()
                }
                return () => {
                    if (ws.current) {
                        ws.current.close();
                    }
                };
            }

        }, [isEnter]);

        const hostCheck = (participant) => {
            console.log(participant.host)
            if (participant.host) {
                return participant.getVideoElement()
            }
        }

        function receiveVideoResponse(result) {
            participants[result.name].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
                if (error) return console.error(error);
            });
        }

        const register = () => {
            let message = {
                id: "joinRoom",
                name: name.current,
                userId: userId.current,
                room: roomId.current,
            };
            sendMessageToServer(message);
        };

        const sendMessageToServer = (message) => {
            var jsonMessage = JSON.stringify(message);
            ws.current.send(jsonMessage);
        };

        async function postUser() {
            console.log(name.current)
            try {
                // POST 요청은 body에 실어 보냄
                await axios.post('http://' + locationHost + '/chat/createroom', {
                    name: localStorage.getItem('userId'),
                    roomName: roomId.current,
                    maxUserCnt: '8',
                    chatType: 'video',
                }, {

                    headers: {
                        Authorization: localStorage.getItem("accessToken")
                    }

                });
            } catch (e) {
                console.error(e);
            }
            host.current = true;
            enterRoom(roomId.current, name.current)
        }

        const updateRooms = async () => {
            try {
                const data = await axios.get('http://' + locationHost + '/chat/allrooms', {
                    headers: {
                        Authorization: localStorage.getItem("accessToken")
                    }
                })
                setRooms(data.data)
                console.log(rooms)
                console.log(data)
            } catch (e) {
                console.error(e);
            }
        }

        const enterRoom = (roomIds, names) => {
            console.log(roomIds, names)
            userId.current = names
            name.current = names
            roomId.current = roomIds
            roomName.current = roomIds
            setIsEnter(true)
        }


        const fullScreen = () => {
            Object.values(participants).map((participant) => {
                console.log(participant.host)
                if (participant.host) {
                    participant.getVideoElement().requestFullscreen()
                    return;
                }
            })
        }

        const changeRoom = (e) => {
            roomId.current = e.target.value
        }

        const exit = () => {
            leftUser()
            setIsEnter(false)
        }


        return (
            <div>
                <div>
                    {!isEnter && <button onClick={postUser}>방 생성</button>}
                    {!isEnter && (
                        <div>
                            <input
                                type="text"
                                placeholder="방 이름 입력"
                                onChange={changeRoom}
                            />
                        </div>
                    )}
                    {!isEnter && <button onClick={updateRooms}>새로고침</button>}
                    {isEnter && <button onClick={exit}>퇴장</button>}
                    {isEnter && <button onClick={() => screenShare()}> 화면 공유</button>}
                    {isEnter && <button onClick={() => fullScreen()}>풀스크린</button>}
                    {rooms && rooms.map((room) => (
                        <button onClick={() => enterRoom(room, localStorage.getItem('userId'))}>{room}</button>
                    ))}
                    <FileUploader files={files}/>
                </div>
                {isEnter && <div id='participants'>
                    {Object.values(participants).map((participant) => (
                        <div key={participant.name}>
                            {participant.getVideoElement()} {/* 비디오 요소 사용 */}
                            <span>
                            {participant.name}
                            </span>
                        </div>
                    ))}
                </div>}
            </div>
        );
    }
;

export default SfuStream;
