import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Record from "./Record";

import Leaderboard from "./Leaderboard";

import Profile from "./Profile";

import Admin from "./Admin";

import Feedback from "./Feedback";

import Review from "./Review";

import UserIdFetcher from "./UserIdFetcher";

import PublicProfile from "./PublicProfile";

import Badges from "./Badges";

import RegionalMap from "./RegionalMap";

import UpgradeComplete from "./UpgradeComplete";

import TrainingCountdown from "./TrainingCountdown";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Record: Record,
    
    Leaderboard: Leaderboard,
    
    Profile: Profile,
    
    Admin: Admin,
    
    Feedback: Feedback,
    
    Review: Review,
    
    UserIdFetcher: UserIdFetcher,
    
    PublicProfile: PublicProfile,
    
    Badges: Badges,
    
    RegionalMap: RegionalMap,
    
    UpgradeComplete: UpgradeComplete,
    
    TrainingCountdown: TrainingCountdown,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Record" element={<Record />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Feedback" element={<Feedback />} />
                
                <Route path="/Review" element={<Review />} />
                
                <Route path="/UserIdFetcher" element={<UserIdFetcher />} />
                
                <Route path="/PublicProfile" element={<PublicProfile />} />
                
                <Route path="/Badges" element={<Badges />} />
                
                <Route path="/RegionalMap" element={<RegionalMap />} />
                
                <Route path="/UpgradeComplete" element={<UpgradeComplete />} />
                
                <Route path="/TrainingCountdown" element={<TrainingCountdown />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}