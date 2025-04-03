import React from 'react';
import NavBar from '../../../components/NavBar';
import PromotionList from '../../../components/PromotionList'

const Promotions = () => {
  return (
    <div>
      <NavBar>
        <div className="promotions">
          {/* to filter promotions*/}
          <PromotionList />
        </div>
      </NavBar>
    </div>
  );
};

export default Promotions;