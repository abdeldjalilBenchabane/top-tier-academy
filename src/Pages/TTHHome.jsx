import React from 'react'
import Hero from "../components/TTHHero";
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
            <Hero />
            <Cardes />
            <AboutUs />
            <FanCard/>
            <Avis/>
            <Footer />
        </div>
    )
}

export default Home