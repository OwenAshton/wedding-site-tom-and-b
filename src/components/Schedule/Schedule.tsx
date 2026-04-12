import {FC, useState, useEffect} from 'react';
import ScheduleItem from './ScheduleItem';
import './Schedule.css';
const martiniIcon = '/icons/scheduleIcons/001-martini.png';
const ceremonyIcon = '/icons/scheduleIcons/004-diamond.png';
const photoIcon = '/icons/generalSections/002-camera.png';
const dinnerIcon = '/icons/scheduleIcons/005-wedding-dinner.png';
const discoIcon = '/icons/scheduleIcons/006-disco-ball.png';
const carriagesIcon = '/icons/scheduleIcons/003-wedding-car.png';

const allItems = [
    { iconUrl: martiniIcon, text: "Arrivals & Welcome Drinks", time: "12:30pm", eveningOnly: false },
    { iconUrl: ceremonyIcon, text: "Ceremony", time: "1:30pm", eveningOnly: false },
    { iconUrl: photoIcon, text: "Photos & Garden/Pub Games", time: "3:00pm", eveningOnly: false },
    { iconUrl: dinnerIcon, text: "Dinner & Drinks", time: "4:00pm", eveningOnly: false },
    { iconUrl: martiniIcon, text: "Evening Guests Arrive", time: "6:30pm", eveningOnly: true },
    { iconUrl: discoIcon, text: "First Dance & Disco", time: "7:00pm", eveningOnly: true },
    { iconUrl: dinnerIcon, text: "Pizzas", time: "8:45pm", eveningOnly: true },
    { iconUrl: martiniIcon, text: "Last Orders", time: "11:15pm", eveningOnly: true },
    { iconUrl: carriagesIcon, text: "Carriages", time: "12:00am", eveningOnly: true },
];

const ScheduleComponent = ({ isEvening = false }: { isEvening?: boolean }) : FC<{}> =>{
    const [isMobile, setMobileView] = useState(true);

    const handleIsMobile = () => {
        if (window.innerWidth < 500) {
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

    const items = isEvening ? allItems.filter((item) => item.eveningOnly) : allItems;

    return (
        <div className={isMobile?"schedule-container-mobile":"schedule-container"}>
            {items.map((item, idx) => (
                <ScheduleItem
                    key={idx}
                    iconUrl={item.iconUrl}
                    text={item.text}
                    time={item.time}
                    index={idx + 1}
                    isLast={idx === items.length - 1}/>
            ))}
        </div>
        )
}

export default ScheduleComponent;
