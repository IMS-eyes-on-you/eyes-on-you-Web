import React, { useState, useRef } from 'react';
import './css/Login.css';
import {useNavigate} from "react-router-dom";
import axios from 'axios';

const Login = () => {
    localStorage.setItem('sucess', true)
    const userId = useRef(null)
    const password = useRef(null)
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate()
    const locationHost = '192.168.0.15:8080'
    const login = async () => {
        try {
            // POST 요청은 body에 실어 보냄
            const data = await axios.post('http://'+locationHost+'/auth/signin', {
                id: userId.current,
                password: password.current,
            });
            localStorage.setItem('accessToken', data.data.accessToken)
            localStorage.setItem('refreshToken', data.data.refreshToken)
            localStorage.setItem('userId', userId.current)
            moveMain()
        } catch (e) {
            console.error(e);
        }
    }
    const moveMain=()=>{
        navigate('/classroom')
    }

    const changeId = (e) => {
        userId.current = e.target.value
    }
    const changePassword = (e) => {
        password.current = e.target.value
    }

    const handleLoginClick = () => {
        setIsExpanded(true);
    };
    const handleSignUpClick = () =>{
        navigate('/signup')
    }


    return (
        <div className={`login-wrap ${isExpanded ? 'expanded' : ''}`}>
            <div className="login-form">
                <div className="login-form-logo">
                    <h1>
                        <span>E</span>
                        <span>Y</span>
                        <span>E</span>
                        <span>S</span>
                        <span>O</span>
                        <span>N</span>
                        <span>Y</span>
                        <span>O</span>
                        <span>U</span>
                    </h1>
                </div>
                <div className="login-form-box">
                    {!isExpanded && (
                        <>
                            <button
                                className="login-form-box-login-btn"
                                onClick={handleLoginClick}
                            >
                                로그인
                            </button>
                            <button className="login-form-box-register-btn" onClick={handleSignUpClick}>회원가입</button>
                        </>
                    )}
                    <div className="login-inputs">
                        <input type="text" placeholder="아이디" className="login-id" onChange={changeId}/>
                        <input type="password" placeholder="비밀번호" className="login-password" onChange={changePassword}/>
                        <button className="login-submit-btn" onClick={login}>로그인</button>
                        <a href="http://192.168.0.15:8080/oauth2/authorization/naver">네이버 로그인</a>
                        <a href="http://192.168.0.15:8080/oauth2/authorization/google">구글 로그인</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
