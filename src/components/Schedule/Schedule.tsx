import {FC, useState, useEffect} from 'react';
import ScheduleItem from './ScheduleItem';
import './Schedule.css';
const martiniIcon = '/icons/scheduleIcons/001-martini.png';
const ceremonyIcon = '/icons/scheduleIcons/004-diamond.png';
const photoIcon = '/icons/generalSections/002-camera.png';
const dinnerIcon = '/icons/scheduleIcons/005-wedding-dinner.png';
const discoIcon = '/icons/scheduleIcons/006-disco-ball.png';
const carriagesIcon = '/icons/scheduleIcons/003-wedding-car.png';

const ScheduleComponent = () : FC<{}> =>{
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

    return (
        <div className={isMobile?"schedule-container-mobile":"schedule-container"}>
            <ScheduleItem
                iconUrl={martiniIcon}
                text={"Arrivals & Welcome Drinks"}
                time={"12:30pm"}
                index={1}
                isLast={false}/>
            <ScheduleItem
                iconUrl={ceremonyIcon}
                text={"Ceremony"}
                time={"1:30pm"}
                index={2}
                isLast={false}/>
            <ScheduleItem
                iconUrl={photoIcon}
                text={"Photos & Garden/Pub Games"}
                time={"3:00pm"}
                index={3}
                isLast={false}/>
            <ScheduleItem
                iconUrl={dinnerIcon}
                text={"Dinner & Drinks"}
                time={"4:00pm"}
                index={4}
                isLast={false}/>
            <ScheduleItem
                iconUrl={martiniIcon}
                text={"Evening Guests Arrive"}
                time={"6:30pm"}
                index={5}
                isLast={false}/>
            <ScheduleItem
                iconUrl={discoIcon}
                text={"First Dance & Disco"}
                time={"7:00pm"}
                index={6}
                isLast={false}/>
            <ScheduleItem
                iconUrl={dinnerIcon}
                text={"Pizzas"}
                time={"8:45pm"}
                index={7}
                isLast={false}/>
            <ScheduleItem
                iconUrl={martiniIcon}
                text={"Last Orders"}
                time={"11:15pm"}
                index={8}
                isLast={false}/>
            <ScheduleItem
                iconUrl={carriagesIcon}
                text={"Carriages"}
                time={"12:00am"}
                index={9}
                isLast={true}/>
        </div>
        )
}

export default ScheduleComponent;
