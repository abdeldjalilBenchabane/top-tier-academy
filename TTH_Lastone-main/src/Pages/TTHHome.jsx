import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom';
import TTHSlides from "../components/TTHSlides";
import NavBar from "../components/NavBar";
import Cardes from "../components/TTHCards";
import AboutUs from "../components/TTHAboutUs";
import Footer from "../components/TTHFooter";
import FanCard from '../components/TTHFanCard';
import Avis from "../components/TTHAvis";
import { paymentsAPI } from '../services/api';

const Home = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handlePaymentSuccess = async () => {
            const transactionId = searchParams.get('transaction_id');
            const paymentSuccess = searchParams.get('payment_success');
            
            if (paymentSuccess === 'true' && transactionId) {
                try {
                    // Get transaction details
                    const response = await paymentsAPI.getTransactionStatus(transactionId);
                    const transaction = response.transaction;
                    
                    if (transaction && transaction.status === 'completed') {
                        // Trigger points update in navbar
                        window.dispatchEvent(new CustomEvent('pointsUpdated', {
                            detail: { points: transaction.points }
                        }));
                        
                        // Show success message
                        alert(`تم إضافة ${transaction.points.toLocaleString()} نقطة لحسابك بنجاح! 🎉`);
                        
                        // Clean URL
                        window.history.replaceState({}, document.title, '/');
                    }
                } catch (error) {
                    console.error('Error handling payment success:', error);
                }
            }
        };

        handlePaymentSuccess();
    }, [searchParams]);

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