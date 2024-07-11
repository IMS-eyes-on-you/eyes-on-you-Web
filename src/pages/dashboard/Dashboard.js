import './css/Dashboard.css'
import SideBar from "../main/SideBar";
import TopBar from "../main/TopBar";
const Dashboard = ()=>{

    return(
        <div className="dashboard">
            <SideBar/>
            <TopBar/>
            <div className="dashboard-data-form">
                <div className="dashboard-data-form-title">
                    <p>제목</p>
                    <p>소제목</p>
                </div>
                <div className="dashboard-data-form-chart"></div>
            </div>
            <div className=" ">
                <div className="dashboard-status-form-info">
                    <div className="dashboard-status-form-info-title">
                        <p>제목</p>
                    </div>
                    <div className="dashboard-status-form-info-chart">
                    </div>
                </div>
            </div>

        </div>

    )
}
export default Dashboard
