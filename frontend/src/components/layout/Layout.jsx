import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout({ showFooter = true, noScroll = false }) {
  return (
    <div className={noScroll ? 'h-screen overflow-hidden flex flex-col bg-ice-50' : 'min-h-screen flex flex-col bg-ice-50'}>
      <Navbar />
      <main className={noScroll ? 'flex-1 overflow-hidden' : 'flex-1'}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  )
}
