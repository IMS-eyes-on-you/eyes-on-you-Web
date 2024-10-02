import React, {useEffect, useRef, useState} from 'react';
import './css/TopBar.css';

const TopBar = () => {
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

    return (
        <div className="top-bar">
            <p>
                tobii data: {data}
            </p>
            <button className="top-bar-account-btn"></button>
            <button className="top-bar-notice-btn">
                <svg width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.5002 37.5834C22.3793 37.5834 23.9168 36.0459 23.9168 34.1667H17.0835C17.0835 36.0459 18.6039 37.5834 20.5002 37.5834ZM30.7502 27.3334V18.7917C30.7502 13.5471 27.9485 9.15671 23.0627 7.99504V6.83337C23.0627 5.41546 21.9181 4.27087 20.5002 4.27087C19.0822 4.27087 17.9377 5.41546 17.9377 6.83337V7.99504C13.0347 9.15671 10.2502 13.53 10.2502 18.7917V27.3334L6.8335 30.75V32.4584H34.1668V30.75L30.7502 27.3334Z" fill="white" fillOpacity="0.87"/>
                </svg>
            </button>
            <button onClick={sendEyeData}>전송</button>
        </div>
    );
};

export default TopBar;
