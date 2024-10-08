import React, {useEffect, useRef, useState} from 'react'
import FileUploader from './FileUploader'
import io from 'socket.io-client'

const SfuStream = ({files}) => {

    const [roomName, setRoomName] = useState('');
    const [isMuted, setIsMuted] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showCall, setShowCall] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const socketRef = useRef();
    const myFaceRef = useRef();
    const myStreamRef = useRef();
    const sendPeerRef = useRef();
    const recvPeerMapRef = useRef(new Map());
    const [peerStreams, setPeerStreams] = useState(new Map());
    const isShareView = useRef(false)
    const shareView = useRef(null)
    const screenShareStreamRef = useRef();
    const originalVideoTrackRef = useRef(null);
    const isHost = useRef(false)
    const userList = useRef(new Map())
    const [hostId, setHostId] = useState(null);
  
  
    const stopScreenSharing = async () => {
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach(track => track.stop());
        
        // 원래의 카메라 트랙으로 돌아가기
        if (originalVideoTrackRef.current) {
          await replaceVideoTrack(originalVideoTrackRef.current);
        } else {
          // 만약 원본 트랙이 없다면 새로운 카메라 스트림을 얻음
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          await replaceVideoTrack(newStream.getVideoTracks()[0]);
        }
        
        setIsScreenSharing(false);
      }
    };
  
    const replaceVideoTrack = async (newTrack) => {
      if (sendPeerRef.current) {
        const videoSender = sendPeerRef.current.getSenders().find(sender => sender.track && sender.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newTrack);
        }
      }
      if (myFaceRef.current) {
        const stream = myFaceRef.current.srcObject;
        const oldTrack = stream.getVideoTracks()[0];
        stream.removeTrack(oldTrack);
        stream.addTrack(newTrack);
        myStreamRef.current = stream;
      }
    };
  
    useEffect(() => {
      startConnect();
    }, []);


    const startConnect = () => {
      socketRef.current = io("http://192.168.0.30:9000");
      console.log("socket connected")
      
      socketRef.current.on("user_list", handleUserList);
      socketRef.current.on("recvCandidate", handleRecvCandidate);
      socketRef.current.on("sendCandidate", handleSendCandidate);
      socketRef.current.on("newStream", handleNewStream);
      socketRef.current.on("sendAnswer", handleSendAnswer);
      socketRef.current.on("recvAnswer", handleRecvAnswer);
      socketRef.current.on("host_list", handleHostList)
      socketRef.current.on("hostOut", hostOut)
      socketRef.current.on("bye", handleBye);
  
      return () => socketRef.current.disconnect();
    }
  
    const getMedia = async (deviceId) => {
      const initialConstraints = {
        audio: true,
        video: { facingMode: "user" },
      };
  
      const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
      };
  
      try {
        myStreamRef.current = await navigator.mediaDevices.getUserMedia(
          deviceId ? cameraConstraints : initialConstraints
        );
        if (myFaceRef.current) {
          myFaceRef.current.srcObject = myStreamRef.current;
          console.log(myFaceRef.current)
        }
        if (!deviceId) {
          await getCameras();
        }
      } catch (e) {
        console.log(e);
      }
    };
  
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameraDevices = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStreamRef.current.getVideoTracks()[0];
        setCameras(cameraDevices.map(camera => ({
          deviceId: camera.deviceId,
          label: camera.label,
          isSelected: currentCamera.label === camera.label
        })));
      } catch (e) {
        console.log(e);
      }
    };
  
    const handleMuteClick = () => {
      myStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    };
  
    const handleCameraClick = () => {
      myStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
    };
  
    const handleScreenClick = async () => {
      if (!isScreenSharing) {
        try {
          // 현재 비디오 트랙을 저장
          originalVideoTrackRef.current = myStreamRef.current.getVideoTracks()[0];
  
          screenShareStreamRef.current = await navigator.mediaDevices.getDisplayMedia({ video: true });
          await replaceVideoTrack(screenShareStreamRef.current.getVideoTracks()[0]);
          setIsScreenSharing(true);
  
          screenShareStreamRef.current.getVideoTracks()[0].addEventListener('ended', () => {
            stopScreenSharing();
          });
        } catch (err) {
          console.error("Error starting screen share:", err);
        }
      } else {
        stopScreenSharing();
      }
    };
  
    const handleCameraChange = async (event) => {
      await getMedia(event.target.value);
      if (sendPeerRef.current) {
        const videoTrack = myStreamRef.current.getVideoTracks()[0];
        const videoSender = sendPeerRef.current
          .getSenders()
          .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
      }
    };
  
    const initCall = async () => {
      setShowCall(true);
      await getMedia();
    };
  
    const handleWelcomeSubmit = async (event) => {
      event.preventDefault();
      await initCall();
      socketRef.current.emit("join_room", roomName);
      setRoomName(roomName);
    };
  
    // WebRTC and Socket event handlers
    const handleUserList = (idList) => {
      console.log("user_list = " + idList.toString());
      if(idList.length === 0){
        isHost.current = true
        handleScreenClick()
        setHostId('me')
      }
      else{
        hostId.current = idList[0]
      }
      
      idList.forEach((id) => {
        createRecvPeer(id);
        createRecvOffer(id);
      });
      createSendPeer();
      createSendOffer();
    };

    const handleHostList = (hostUserList) => {
      //hostList.current = hostUserList
    }
  
    const handleRecvCandidate = async (candidate, sendId) => {
      console.log("got recvCandidate from server");
      recvPeerMapRef.current.get(sendId).addIceCandidate(candidate);
    };
  
    const handleSendCandidate = async (candidate) => {
      console.log("got sendCandidate from server");
      sendPeerRef.current.addIceCandidate(candidate);
    };
  
    const handleNewStream = (id) => {
      console.log(`newStream id=${id}`);
      createRecvPeer(id);
      createRecvOffer(id);
    };
  
    const handleSendAnswer = async (answer) => {
      console.log("got sendAnswer from server");
      sendPeerRef.current.setRemoteDescription(answer);
    };
  
    const handleRecvAnswer = async (answer, sendId) => {
      console.log("got recvAnswer from server");
      recvPeerMapRef.current.get(sendId).setRemoteDescription(answer);
    };
  
    const handleBye = (fromId) => {
      console.log("bye " + fromId);
      try{
        recvPeerMapRef.current.get(fromId).close();
        recvPeerMapRef.current.delete(fromId);
        setPeerStreams(prevStreams => {
          const newStreams = new Map(prevStreams);
          newStreams.delete(fromId);
          return newStreams;
      });
      }
      catch{
        
      }
      
    };

    const handleExit = () => {
      console.log("host :", isHost.current)
      if(isHost.current == true){
        socketRef.current.emit("hostExit", roomName)

      }
      socketRef.current.disconnect()
      setShowCall(false)
      myStreamRef.current.getTracks()[0].stop()
      startConnect();
      setPeerStreams(new Map());
    }

    const hostOut = (getRoomName) => {
      console.log("hostOut")
      console.log(getRoomName)
      if(roomName === getRoomName) return
      console.log("Other user is Out")
      socketRef.current.disconnect()
      setShowCall(false)
      window.location.reload()
      myStreamRef.current.getTracks()[0].stop()
      startConnect();
    }

  
    const createSendPeer = () => {
      sendPeerRef.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: ["turn:220.149.128.13:8080"],
            username: "username",
            credential: "password",
          },
        ],
      });
  
      sendPeerRef.current.addEventListener("icecandidate", (data) => {
        console.log(`sent sendCandidate to server`);
        socketRef.current.emit("sendCandidate", data.candidate);
      });
  
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => {
          sendPeerRef.current.addTrack(track, myStreamRef.current);
        });
        console.log("add local stream");
      } else {
        console.log("no local stream");
      }
      
    };
  
    const createSendOffer = async () => {
      console.log(`createSendOffer`);
      const offer = await sendPeerRef.current.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      });
  
      sendPeerRef.current.setLocalDescription(offer);
      socketRef.current.emit("sendOffer", offer);
    };
  
    const createRecvPeer = (sendId) => {
      const newPeer = new RTCPeerConnection({
        iceServers: [
          {
            urls: ["turn:220.149.128.13:8080"],
            username: "username",
            credential: "password",
          },
        ],
      });
  
      newPeer.addEventListener("icecandidate", (data) => {
        console.log(`sent recvCandidate to server`);
        socketRef.current.emit("recvCandidate", data.candidate, sendId);
      });
  
      newPeer.addEventListener("track", (data) => {
        handleTrack(data, sendId);
        
      });
  
      recvPeerMapRef.current.set(sendId, newPeer);
    };
  
    const createRecvOffer = async (sendId) => {
      console.log(`createRecvOffer sendId = ${sendId}`);
      const offer = await recvPeerMapRef.current.get(sendId).createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
  
      recvPeerMapRef.current.get(sendId).setLocalDescription(offer);
  
      console.log(`send recvOffer to server`);
      socketRef.current.emit("recvOffer", offer, sendId);
    };
  
    const handleTrack = (data, sendId) => {
      console.log(`handleTrack from ${sendId}`);
      setPeerStreams(prevStreams => new Map(prevStreams).set(sendId, data.streams[0]));
    };
  
    const fullScreen = () => {
      if (hostId) {
          let hostVideo;
          if (hostId === 'me') {
              hostVideo = myFaceRef.current;
          } else {
              hostVideo = document.getElementById(`peer-${hostId}`);
          }
          
          if (hostVideo) {
              if (hostVideo.requestFullscreen) {
                  hostVideo.requestFullscreen();
              } else if (hostVideo.mozRequestFullScreen) { // Firefox
                  hostVideo.mozRequestFullScreen();
              } else if (hostVideo.webkitRequestFullscreen) { // Chrome, Safari and Opera
                  hostVideo.webkitRequestFullscreen();
              } else if (hostVideo.msRequestFullscreen) { // IE/Edge
                  hostVideo.msRequestFullscreen();
              }
          }
      }
  }


        return (
            <div className="App">
      <header>
      </header>
      <main>
        {!showCall ? (
          <div id="welcome">
            <form onSubmit={handleWelcomeSubmit}>
              <input
                placeholder="room name"
                required
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <button type="submit">Enter Room</button>
            </form>
          </div>
        ) : (
          <div id="call">
            <div id="myStream">
              <video
                id="myFace"
                ref={myFaceRef}
                autoPlay
                playsInline
                width="100"
                height="100"
              />
              <button onClick={handleMuteClick}>
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button onClick={handleCameraClick}>
                {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
              </button>
              <button onClick={handleScreenClick}>
                {isScreenSharing ? "Turn Camera" : "Share screen"}
              </button>
              <button onClick={handleExit}>
                {"exit button"}
              </button>
              <button onClick={fullScreen}>
                {"full screen"}
              </button>

              <select onChange={handleCameraChange}>
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId} selected={camera.isSelected}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>
            <div id="peerStreams">
              {Array.from(peerStreams).map(([id, stream]) => (
                <video
                  key={id}
                  id={"peer-"+id}
                  autoPlay
                  playsInline
                  width="100"
                  height="100"
                  ref={(el) => {
                    if (el) el.srcObject = stream;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
      <FileUploader files={files}/>
    </div>
        );
    }
;

export default SfuStream;
