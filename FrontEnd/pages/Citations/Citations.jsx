import Base from "../../components/layout/Base";
import CitationCard from "../../components/ForPages/Citations/CitationCard";
import axios from "axios";
import {useEffect, useRef, useState} from "react";
import { ProgressSpinner } from 'primereact/progressspinner';
import Steve from '../../assets/images/SteveMC.png';
import '../../assets/css/pages/Citations/Citations.css'
import InfiniteScroll from "react-infinite-scroll-component";

export default function Citations() {
    const [allCitations, setAllCitations] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    async function fetchMoreData()
    {
        if(totalPages === null || page <= totalPages) {
            const response = await axios.get(`/startalk-api/citations?page=${page}`)
                .then(data => data.data)
                .then(data => {
                    setTotalPages(data.totalPages);
                    const citations = data.citations;

                    setAllCitations((prev) => {
                        if(page === 1){
                            setPage(2);
                            return citations;
                        }
                        else{
                            setPage((old) => old + 1);
                            return [...prev, ...citations];
                        }
                    });
                });
        }
        else{
            setHasMore(false);
        }
    }

    useEffect( () => {
        fetchMoreData();
    }, []);

    return (
        <Base>
            <div className="Citations">
                <InfiniteScroll
                    dataLength={allCitations.length}
                    next={fetchMoreData}
                    hasMore={hasMore}
                    scrollThreshold={0.5}
                    pullDownToRefreshThreshold={0}
                    scrollableTarget={"Main"}
                    loader={
                        <div className="ProgressSpinner">
                            <ProgressSpinner
                                pt={{
                                    spinner: {style: {animationDuration: '0.8s'}},
                                    circle: {style: {stroke: '#5a67f6', strokeWidth: 4, animation: '-moz-initial'}}
                            }}
                            />
                        </div>
                    }
                    endMessage={
                        <div className="end-of-content">
                            <img src={Steve} alt="Steve" className="steve-image"
                            title="Credit to DALLE.E-3 for generating the initial photo and Mazen for correcting some small errors in the image"/>
                        </div>

                    }
                >
                    {
                        allCitations.map((cit, key) =>
                            <CitationCard
                                citation={cit} key={key}
                            />
                        )
                    }
                </InfiniteScroll>
            </div>
        </Base>
    );
}
