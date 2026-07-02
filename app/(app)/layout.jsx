import Sidebar from '@/components/sidebar/Sidebar';
import MobileSidebar from '@/components/sidebar/MobileSidebar';

export default function AppLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-[#0f0f17]">
            <Sidebar />
            <MobileSidebar />
            <main className="flex-1 lg:pl-64">
                {children}
            </main>
        </div>
    );
}
