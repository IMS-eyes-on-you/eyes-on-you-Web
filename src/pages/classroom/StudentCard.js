import './css/StudentCard.css';

const StudentCard = ({ student }) => (
    <div className="student-card">
        <div className="student-card-profile">
            <img src={`${process.env.PUBLIC_URL}/top-bar-profile.png`} alt="Profile"/>
            <p className="student-card-profile-name">{student.name}</p>
        </div>
        <div className="student-card-control-box">
            <button className="student-card-mute">

            </button>
            <button className="student-card-cam">

            </button>
        </div>
    </div>
);

export default StudentCard;
