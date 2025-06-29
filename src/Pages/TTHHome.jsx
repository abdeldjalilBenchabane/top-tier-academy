import React from 'react'
import TTHSlides from "../components/TTHSlides";
import NavBar from "../components/NavBar";
import Cardes from "../components/TTHCards";
import AboutUs from "../components/TTHAboutUs";
import Footer from "../components/TTHFooter";
import FanCard from '../components/TTHFanCard';
import Avis from "../components/TTHAvis";

const Home = () => {
    return (
        <div className="">
            <NavBar/>
            <TTHSlides />
            <Cardes />
            <AboutUs />
            <FanCard/>
            <Avis/>
            <Footer />
        </div>
    )
}

export default Home