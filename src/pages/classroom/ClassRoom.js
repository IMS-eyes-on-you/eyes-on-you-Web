import React, {useEffect, useRef, useState} from "react";
import SideBar from "../main/SideBar";
import TopBar from "../main/TopBar";
import './css/ClassRoom.css';
import SideList from "./SideList";
import SfuStream from "./SfuStream"

const ClassRoom = () => {
    const [files, setFiles] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');

    const [data, setData] = useState();
    const [dataArray, setDataArray] = useState([]);

    const dataRef = useRef([]);

    useEffect(() => {
        if (window.electron && window.electron.tobiiJarOutput) {
            window.electron.tobiiJarOutput((output) => {
                setData(output);
                const parsedData = parseJson(output);
                dataRef.current.push(parsedData);
            });
        } else {
            setData(['웹에서는 동작 안해요']);
        }
    }, []);

    function parseJson(data) {
        const dataArray = data.split(',');
        const parsedObject = {
            xRatio: parseFloat(dataArray[0]),
            yRatio: parseFloat(dataArray[1]),
            xPosition: parseInt(dataArray[2], 10),
            yPosition: parseInt(dataArray[3], 10)
        };

        return parsedObject;
    }
    const sendEyeData = async () => {
        try {
            const response = await fetch('http://192.168.0.30:8888/send/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataRef.current),
            });
            if (response.ok) {
                console.log('데이터 전송 성공');
                dataRef.current = [];
                setDataArray([]);
            } else {
                console.error('데이터 전송 중 오류 발생', dataRef.current);
            }
        } catch (error) {
            console.error('데이터 전송 중 오류 발생', error);
        }
    };
    useEffect(() => {
        // SSE 연결 설정
        const eventSource = new EventSource('http://192.168.0.30:8888/alert');

        eventSource.onopen = () => {
            console.log("SSE-Connect")
        }
        eventSource.onmessage = async (event) => {
            console.log(event.data);
            setAlertMessage(event.data);

            if (event.data === "exit") {
                try {
                    await sendEyeData();
                } catch (error) {
                    console.error('sendEyeData failed:', error);
                }
            }
        };
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
