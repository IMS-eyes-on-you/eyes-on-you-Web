import React, { useState } from 'react';
import axios from 'axios';
import './css/SignUp.css';
import {useNavigate} from "react-router-dom";

const SignUp = () => {
    const [formData, setFormData] = useState({
        id: '',
        password: '',
        email: '',
        role: '',
        name: '',
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:8080/auth/signup', formData);
            console.log('회원가입 성공:', response.data);
            navigate('/classroom')

        } catch (err) {
            console.error('회원가입 실패:', err.response?.data || err.message);
            setError('회원가입에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>회원가입</h2>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="이름"
                    required
                />
                <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    placeholder="아이디"
                    required
                />
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호"
                    required
                />
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="이메일"
                    required
                />
                <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="역할"
                    required
                />

                <button type="submit">가입하기</button>
            </form>
        </div>
    );
};

export default SignUp;
