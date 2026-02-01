import { Outlet } from 'react-router-dom';
import BottomNav from './mapa/goggle_maps_mock/BottomNav';

const Layout = () => {
    return (
        <div style={{
            minHeight: '100vh',
            position: 'relative',
            paddingBottom: '90px' // Space for bottom nav
        }}>
            <div>
                <Outlet />
            </div>
            <BottomNav />
        </div>
    );
};

export default Layout;
