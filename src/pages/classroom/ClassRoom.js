import React, { useState } from "react";
import SideBar from "../main/SideBar";
import TopBar from "../main/TopBar";
import './css/ClassRoom.css';
import FileUploader from "./FileUploader";
import SideList from "./SideList";
import SfuStream from "./SfuStream"

const ClassRoom = () => {
    const [files, setFiles] = useState([]);
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
