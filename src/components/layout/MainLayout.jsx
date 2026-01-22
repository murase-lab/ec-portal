import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function MainLayout({ children, title }) {
    const location = useLocation()

    return (
        <div className="flex">
            <Sidebar activePath={location.pathname} />
            <main className="flex-1 min-h-screen lg:ml-72 bg-background-light pb-24">
                <Header title={title} />
                {children}
                <MobileNav activePath={location.pathname} />
            </main>
        </div>
    )
}
