import './App.css';
import ClassRoom from "./pages/classroom/ClassRoom";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import SfuStream from "./pages/classroom/SfuStream";
import SignUp from "./pages/auth/SignUp";

function App() {
  return (
    <div>
      <BrowserRouter>
        <div className="App">
          <main>
            <section className="feature">
              <Routes>
                <Route path="/" element={<Login/>}/>
                <Route path="classroom" element={<ClassRoom/>}/>
                <Route path="dashboard" element={<Dashboard/>}/>
                <Route path="/stream" element={<SfuStream/>}/>
                <Route path="/signup" element={<SignUp/>}/>
              </Routes>
            </section>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
