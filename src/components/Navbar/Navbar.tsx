import {useState, useEffect, FC} from "react";
import './Navbar.css';
const burger = 'bars-solid.svg';

const Navbar : FC<{}> = (props: { children: any; }) => {
    const [isMenuOpen, setMenuTrigger] = useState(false);
    const [isMobile, setMobileView] = useState(true);

    useEffect(() => {
        handleIsMobile();
      window.addEventListener("resize", handleIsMobile);

      return () => {
        window.removeEventListener("resize", handleIsMobile);
      };
    }, []);

    const handleIsMobile = () => {
        if (window.innerWidth < 720) {
            setMobileView(true);
        } else {
            setMobileView(false)
        }
    }

    const toggleMenuView = () => {
        setMenuTrigger(!isMenuOpen);
    }

    
    

return (
    <nav >
        <div className="nav-bar" id="navbar">
            {
                isMobile 
                ? <>
                {   isMenuOpen && <div className="responsive-nav-menu" onClick={toggleMenuView}>
                        {props.children}
                    </div>
                }
                <a className={isMenuOpen? "responsive-nav-burger":"nav-burger"} onClick={toggleMenuView}>
                    <img src={burger} alt="nav-menu-toggle" />
                </a>
                
                </>
             : (props.children)
            }
        </div>

    </nav>
    )
}

export default Navbar;


