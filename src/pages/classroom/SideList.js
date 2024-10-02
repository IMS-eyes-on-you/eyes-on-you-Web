import React, { useState } from 'react';
import StudentCard from "./StudentCard";
import './css/SideList.css';

const SideList = ({ setFiles, files }) => {
    const [view, setView] = useState('students');
    const students = [
        { name: 'Student 1' , profile:'./image/top-bar-profile.png'},
        { name: 'Student 2' ,profile:'./src/image/top-bar-profile.png'},
        { name: 'Student 3' ,profile:'./src/image/top-bar-profile.png'},
    ];

    return (
        <div className="side-list-form">
            <div className="button-area">
                <button
                    className="custom-button"
                    onClick={() => setView('students')}
                >
                    수강생 목록
                </button>
                <button
                    className="custom-button"
                    onClick={() => setView('materials')}
                >
                    강의자료 목록
                </button>
            </div>
            <div className="content-area">
                {view === 'students' && (
                    <div className="student-list">
                        {students.map((student, index) => (
                            <StudentCard key={index} student={student} />
                        ))}
                    </div>
                )}
                {view === 'materials' && (
                    <div className="material-upload">
                        <input
                            type="file"
                            multiple
                            onChange={(el) =>
                                el.target.files?.length &&
                                setFiles(Array.from(el.target.files))
                            }
                        />
                        <div className="file-list">
                            {files.map((file, index) => (
                                <p key={index}>{file.name}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideList;
