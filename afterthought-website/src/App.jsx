import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import MetricsBar from './components/MetricsBar'
import ValueProps from './components/ValueProps'
import Quote from './components/Quote'
import Platform from './components/Platform'
import Footer from './components/Footer'

export default function App() {
    return (
        <>
            <Header />
            <main>
                <Hero />
                <div className="connector-line" />
                <About />
                <MetricsBar />
                <div className="connector-line" />
                <ValueProps />
                <div className="connector-line" />
                <Quote />
                <div className="connector-line" />
                <Platform />
                <div className="connector-line" />
            </main>
            <Footer />
        </>
    )
}
