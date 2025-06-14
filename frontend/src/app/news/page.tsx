'use client';
import { New1, New2, New3, New4 } from "../components/news/newsItem";
import { useData } from "../hooks/useData";

export default function News() {
    const { websitecontent } = useData();
    return (
        <>
            <div className="container text-white" style={{ marginTop: '130px', marginBottom: '100px' }}>
                <div className="row border-top border-bottom">
                    <h1 className="mt-4 mb-4 text-center" style={{ letterSpacing: '10px' }}>TIN TỨC VỀ CHÚNG TÔI</h1>
                </div>
                <div className="row border-bottom">
                    <img className="w-100 mt-3 mb-3" style={{ height: '300px', objectFit: 'cover' }} src="/img/bannernew.png" alt="" />
                </div>
                <New1 new1={websitecontent[3]} />
                <div className="row mt-4 border-top">
                    <div className="col-8 border-end">
                        <New2 new2={websitecontent[4]} />
                        <New3 new3={websitecontent[0]} />
                    </div>
                    <div className="col-4">
                        <New4 new4={websitecontent[2]} />
                    </div>
                </div>
            </div>
        </>
    )
}