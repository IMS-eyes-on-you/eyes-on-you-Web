import React, {useEffect, useState} from "react";
import SideBar from "../main/SideBar";
import TopBar from "../main/TopBar";
import './css/ClassRoom.css';
import SideList from "./SideList";
import SfuStream from "./SfuStream"

const ClassRoom = () => {
    const [files, setFiles] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        // SSE 연결 설정
        const eventSource = new EventSource('http://192.168.0.30:8080/alert');

        eventSource.onopen = () => {
            console.log("SSE-Connect")
        }
        eventSource.onmessage = (event) =>{
            console.log(event.data)
            setAlertMessage(event.data)
        }
        eventSource.onerror = (event) => {
            eventSource.close();
            if (event.target.readyState === EventSource.CLOSED) {
                console.log("연결종료");
            } else {
                console.log("에러발생");
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div className="class-room">
            <TopBar/>
            <SideBar/>
            <div className="main-contents">
                <div className="content-form">
                    <div className="source-form">
                        <SfuStream files={files}/>
                    </div>
                    <div className="side-list">
                        <SideList setFiles={setFiles} files={files} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassRoom;
