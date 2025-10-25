import {FC, useEffect, useState} from 'react';

import './Schedule.css';

const ScheduleItem: FC<{}> = ({iconUrl, text, time, index, isLast}
    :{iconUrl:string; text:string; time:string; index:number; isLast:boolean;}) =>{
    const [isMobile, setMobileView] = useState(true);

    const handleIsMobile = () => {
        if (window.innerWidth < 768) {
            setMobileView(true);
        } else {
            setMobileView(false)
        }
    }

    useEffect(() => {
        handleIsMobile();
      window.addEventListener("resize", handleIsMobile);

      return () => {
        window.removeEventListener("resize", handleIsMobile);
      };
    }, []);


    const renderSeparator = () =>{
        return isLast ? <span className="schedule-item-separator-last"></span> : <span className="schedule-item-separator"></span>
    }


    
    return (
        <div key={`schedule-item-${index}`} className="schedule-item-container">
            <img className="schedule-item-icon" src={iconUrl} format="png" />
            <p className="schedule-item-time">{time}</p>
            {renderSeparator()}
            <span className={isMobile ? "schedule-item-line-point mobile" :"schedule-item-line-point"}></span>
            <p className="schedule-item-text">{text}</p>
        </div>
        )
}

export default ScheduleItem;