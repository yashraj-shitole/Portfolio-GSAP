import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { CustomEase } from 'gsap/CustomEase'
import { SmoothScroll } from './motion/SmoothScroll'
import { CursorGlow } from './motion/CursorGlow'
import { Preloader } from './components/Preloader'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { ExperienceSection, ExperiencePulse } from './components/Experience'
import { Skills } from './components/Skills'
import { Projects } from './components/Projects'
import { Education } from './components/Education'
import { Contact, Footer } from './components/Contact'
import { Marquee } from './components/Marquee'
import { ScrollPath } from './components/ScrollPath'

// Register GSAP plugins once at the app root.
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, CustomEase)

// Custom easings (registered globally, available by name).
CustomEase.create('editorial', '0.22, 1, 0.36, 1')
CustomEase.create('snappy', '0.4, 0, 0.2, 1')
CustomEase.create('magnetic', '0.34, 1.56, 0.64, 1')
CustomEase.create('reveal', 'M0,0 C0.2,0 0.1,1 1,1')

export default function App() {
  const [loaded, setLoaded] = useState(false)

  // Skip the preloader for repeat visitors in the same session.
  useEffect(() => {
    if (sessionStorage.getItem('portfolio-loaded') === '1') setLoaded(true)
  }, [])

  const handleLoaded = () => {
    sessionStorage.setItem('portfolio-loaded', '1')
    setLoaded(true)
  }

  return (
    <>
      <SmoothScroll>
        <CursorGlow />
        <ScrollPath />
        <Nav />
        <main>
          <Hero />
          <Marquee />
          <About />
          <ExperiencePulse />
          <ExperienceSection />
          <Marquee />
          <Skills />
          <Projects />
          <Education />
          <Contact />
        </main>
        <Footer />
      </SmoothScroll>
      {!loaded && <Preloader onComplete={handleLoaded} />}
    </>
  )
}
