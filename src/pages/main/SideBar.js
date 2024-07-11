import {Link} from "react-router-dom";
import { BsBook,BsChat,BsHouse,BsBarChart} from "react-icons/bs";
import './css/SideBar.css'
const SideBar = ()=>{

    return(
        <section className="sidebar">
            <Link to="/">
                <BsHouse size={48}/>
            </Link>
            <Link to="/dashboard">
                <BsBarChart size={48}/>
            </Link>
            <Link to="/classroom">
                <BsChat size={48}/>
            </Link>
            <Link to="/classroom">
                <BsBook size={48}/>
            </Link>


        </section>
    )

}
export default SideBar
