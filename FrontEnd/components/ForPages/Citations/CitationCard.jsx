import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAt, faClock} from "@fortawesome/free-solid-svg-icons";
import React, {useContext, useState} from "react";
import {UserContext} from "../../../utils/UserAuthContext";
import LikeButton from '../../Button/LikeButton';
import FavButton from '../../Button/FavButton';
import '../../../assets/css/components/ForPages/Citaitons/CitationsCard.css'
import LookButton from "../../Button/LookButton";
import DateField from "../../Utils/DateField";
import DeleteButton from "../../Button/DeleteButton";
import UpdateButton from "../../Button/UpdateButton";

export default function CitationCard({citation})
{
    const { isAuthenticated } = useContext(UserContext);
    const [likes, setLikes] = useState(citation.numberLike);

    const Content = (
        <React.Fragment>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                {citation.title}
                <div>
                    <DeleteButton citation={citation} style={{marginRight: '10px'}}/>
                    <UpdateButton citation={citation}/>
                </div>
            </div>
        </React.Fragment>
    );

    return (
        <Card title={Content} className="MyCitationCardCss">
            <Divider/>
            <p>{citation.description}</p>
            <Divider/>
            {isAuthenticated ? (
                <div className="infoCard">
                    <p><FontAwesomeIcon icon={faAt} title="writerName" /> {citation.writerName} </p>
                    <LookButton citation={citation}/>
                    <LikeButton citation={citation} likes={likes} setLikes={setLikes} />
                    <FavButton citation={citation} />
                    <DateField dateString={citation.creationDate} />
                </div>
            ) : (
                <></>
            )}

        </Card>
    );
}
