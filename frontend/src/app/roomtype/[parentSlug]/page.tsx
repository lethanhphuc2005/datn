"use client"
import { useParams } from 'next/navigation';
import { RoomClassList } from '../../components/roomList';
import React, { useEffect } from "react";
import { useRoomSearch } from '../../hooks/useRoomSearch';
import RoomSearchBar from '@/app/components/roomSearchBar';
import { useData } from '@/app/hooks/useData';

export default function Roomclass() {
    const {
        price, setPrice,
        views, setViews,
        amenities, setAmenities,
        dateRange, setDateRange,
        guests, setGuests,
        showCalendar, setShowCalendar,
        showGuestBox, setShowGuestBox,
        guestBoxRef, calendarRef,
        maxGuests, setMaxGuests,
        totalGuests,
        numberOfNights, setNumberOfNights,
        totalPrice, setTotalPrice,
        hasSearched, setHasSearched,
        numberOfAdults,
        numberOfChildren,
        pendingGuests, setPendingGuests,
        pendingDateRange, setPendingDateRange,
        startDate, setStartDate,
        endDate, setEndDate,
        // numAdults,
        // numChildrenUnder6,
        // numChildrenOver6,
        // totalEffectiveGuests
    } = useRoomSearch();
    const {
        roomclass
    } = useData();

    // Sử dụng useParams để lấy parentSlug từ URL
    const params = useParams();
    const parentSlug = params.parentSlug as string;
    // Lọc roomclass theo parentSlug
    const filteredRoomClass = roomclass
        .filter(item => item.main_room_class_id === parentSlug)
        .filter(item =>
            item.price >= price &&
            (views.length === 0 || views.includes(item.view)) &&
            (amenities.length === 0 || amenities.every(am => item.features[0]?.feature_id.name.includes(am)))
        )

    // Tính số người cần giường
    const numAdults = numberOfAdults ?? 0;
    const numChildrenUnder6 = guests.children.age0to6 ?? 0;
    // Tính số trẻ em 7-17 tuổi
    const numChildrenOver6 = guests.children.age7to17 ?? 0; // trẻ 7-17 tuổi

    // Tính số trẻ ≤ 6 tuổi được ngủ chung: Math.floor(numAdults / 2)
    const maxChildrenCanShare = Math.floor(numAdults / 2);

    const numChildrenNeedBed = Math.max(0, numChildrenUnder6 - maxChildrenCanShare);

    // Tổng số người cần giường = người lớn + trẻ 7-17 tuổi + trẻ ≤ 6 tuổi phải nằm riêng
    const totalNeedBed = numAdults + numChildrenOver6 + numChildrenNeedBed;

    // Số giường cần
    let minBedsNeeded = Math.ceil(totalNeedBed / 2);
    // Tính mức độ phù hợp: true nếu đủ giường, false nếu không
    const withSuitabilityFlag = filteredRoomClass.map(room => ({
        ...room,
        isSuitable: room.bed_amount >= minBedsNeeded
    }));
    // Có cần giường kê không?
    const showExtraBedOver6 = numChildrenOver6 > 0 && totalNeedBed > minBedsNeeded * 2;

    // Lọc phòng phù hợp
    let suitableRoomClass = filteredRoomClass.filter(room =>
        room.bed_amount * 2 >= totalNeedBed
    );

    // Sắp xếp phòng 1 giường lên đầu nếu có trẻ 7-17 tuổi
    // if (numChildrenOver6 > 0) {
    //     suitableRoomClass = [
    //         ...suitableRoomClass.filter(room => room.bed_amount === 1),
    //         ...suitableRoomClass.filter(room => room.bed_amount > 1),
    //     ];
    // }

    // Sắp xếp phòng theo số giường phù hợp
    const sortedRoomClass = [...filteredRoomClass].sort((a, b) => a.bed_amount - b.bed_amount);

    // Sau khi đã có suitableRoomClass
    const minBed = Math.min(...suitableRoomClass.map(room => room.bed_amount));

    // Phòng ưu tiên (ít giường nhất)
    const topRooms = suitableRoomClass.filter(room => room.bed_amount === minBed);
    // Phòng còn lại
    const otherRooms = suitableRoomClass.filter(room => room.bed_amount !== minBed);

    // Gộp lại, phòng ít giường lên đầu
    // Sắp xếp: phòng phù hợp trước, ít giường hơn lên đầu
    const displayRoomClass = suitableRoomClass
        .map(room => ({
            ...room,
            isSuitable: room.bed_amount >= minBedsNeeded
        }))
        .sort((a, b) => {
            if (a.isSuitable && !b.isSuitable) return -1;
            if (!a.isSuitable && b.isSuitable) return 1;
            return a.bed_amount - b.bed_amount;
        });



    const handleChange = (e: any) => {
        setPrice(Number(e.target.value));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
        const value = e.target.value;
        if (e.target.checked) {
            setState([...state, value]);
        } else {
            setState(state.filter(item => item !== value));
        }
    };

    // Tìm sức chứa lớn nhất của các phòng đã lọc
    const maxCapacity = filteredRoomClass.reduce((max, room) => Math.max(max, room.capacity), 0);

    // Kiểm tra nếu tổng khách vượt quá sức chứa lớn nhất
    const effectiveChildrenUnder6 = Math.max(0, numChildrenUnder6 - maxChildrenCanShare);
    const totalEffectiveGuests = numAdults + numChildrenOver6 + effectiveChildrenUnder6;
    const isOverCapacity = totalEffectiveGuests > maxCapacity;

    return (
        <>
            <div className={`container text-white`} style={{ height: '1750px', marginTop: '7%', marginBottom: '10%' }}>
                <div className="row">
                    <RoomSearchBar
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        guests={guests}
                        setGuests={setGuests}
                        showCalendar={showCalendar}
                        setShowCalendar={setShowCalendar}
                        showGuestBox={showGuestBox}
                        setShowGuestBox={setShowGuestBox}
                        guestBoxRef={guestBoxRef}
                        calendarRef={calendarRef}
                        maxGuests={maxGuests}
                        setMaxGuests={setMaxGuests}
                        totalGuests={totalGuests}
                        numberOfNights={numberOfNights}
                        setNumberOfNights={setNumberOfNights}
                        totalPrice={totalPrice}
                        setTotalPrice={setTotalPrice}
                        hasSearched={hasSearched}
                        setHasSearched={setHasSearched}
                        numberOfAdults={numberOfAdults}
                        numberOfChildren={numberOfChildren}
                        pendingGuests={pendingGuests}
                        setPendingGuests={setPendingGuests}
                        pendingDateRange={pendingDateRange}
                        setPendingDateRange={setPendingDateRange}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        numAdults={numAdults}
                        numChildrenUnder6={numChildrenUnder6}
                        numChildrenOver6={numChildrenOver6}
                    // totalEffectiveGuests={totalEffectiveGuests}
                    // showExtraBedOver6={showExtraBedOver6}
                    />
                </div>
                <div className="row">
                    <div className='col-3 border-end border-top h-auto'>
                        <div className='sticky-top' style={{ top: '13%' }}>
                            <div className=" mt-3 mb-4" style={{ color: '#FAB320' }}>
                                <p className='fs-5' style={{ letterSpacing: '3px' }}>
                                    Loại phòng {filteredRoomClass[0]?.main_room_class?.[0]?.name || "Đang tải..."}
                                </p>
                            </div>
                            <p className='mt-3'>LỌC THEO GIÁ</p>
                            <input
                                type="range"
                                min="500000"
                                max="5000000"
                                step="100000"
                                value={price}
                                onChange={handleChange}
                                className="w-100"
                            />
                            <p className="mt-2">Giá: {price.toLocaleString('vi-VN')}đ</p>


                            <p className='mt-3'>LỌC THEO VIEW</p>
                            <div className="d-flex gap-3 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value="sea"
                                        id="viewSea"
                                        checked={views.includes("sea")}
                                        onChange={e => handleCheckboxChange(e, views, setViews)}
                                    />
                                    <label className="form-check-label" htmlFor="viewSea">
                                        Sea
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value="city"
                                        id="viewCity"
                                        checked={views.includes("city")}
                                        onChange={e => handleCheckboxChange(e, views, setViews)}
                                    />
                                    <label className="form-check-label" htmlFor="viewCity">
                                        City
                                    </label>
                                </div>
                            </div>

                            <p className="mt-3">LỌC THEO TIỆN NGHI</p>
                            <div className="d-flex gap-3 mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value="Ban công"
                                        id="amenityBanCong"
                                        checked={amenities.includes("Ban công")}
                                        onChange={e => handleCheckboxChange(e, amenities, setAmenities)}
                                    />
                                    <label className="form-check-label" htmlFor="amenityBanCong">
                                        Ban công
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value="Bồn tắm"
                                        id="amenityBonTam"
                                        checked={amenities.includes("Bồn tắm")}
                                        onChange={e => handleCheckboxChange(e, amenities, setAmenities)}
                                    />
                                    <label className="form-check-label" htmlFor="amenityBonTam">
                                        Bồn tắm
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="col-9 border-top">
                        <div className='row p-3 gap-3'>
                            {hasSearched && isOverCapacity ? (
                                <div className="alert alert-danger w-100 text-center">
                                    Số khách bạn chọn vượt quá sức chứa tối đa của các phòng.
                                </div>
                            ) : hasSearched && filteredRoomClass.length === 0 ? (
                                <div className="alert alert-warning w-100 text-center">
                                    Không tìm thấy phòng nào phù hợp với số khách bạn chọn.
                                </div>
                            ) : (
                                <RoomClassList
                                    rcl={displayRoomClass}
                                    numberOfNights={numberOfNights}
                                    totalGuests={totalGuests}
                                    hasSearched={hasSearched}
                                    numberOfAdults={numberOfAdults}
                                    numberOfChildren={numberOfChildren}
                                    startDate={startDate}
                                    endDate={endDate}
                                    numChildrenUnder6={numChildrenUnder6}
                                    numAdults={numberOfAdults}
                                    showExtraBedOver6={showExtraBedOver6}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}