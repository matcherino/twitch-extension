import React from 'react';
// import '../../pages/bootstrap.min.css';
// import '../../pages/styles.css';
import _ from 'lodash';
import accounting from 'accounting';
import star1 from '../Images/1star.png';
import star2 from '../Images/2star.png';
import star3 from '../Images/3star.png';
import star4 from '../Images/4star.png';
import star5 from '../Images/5star.png';
import favicon from '../Images/favicon.png';
import defautlAvatr from '../Images/avatar-default.png';

const images = [star1, star2, star3, star4, star5];

function isTransactionDonation(tx) {
  const {action} = tx;
  return (
    action === 'create' ||
    action === 'donate' ||
    action === 'purchase' ||
    action === 'revshare' ||
    action === 'coupon:use' ||
    action === 'bounty:pool'
  );
}

function sortByIdDesc(obj) {
  return -obj.id;
}

function mergeAndFilterDonationList(acc, tx) {
  const {action} = tx;

  // Check if it should be merged
  if (action === 'coupon:use') {
    const prev = acc[acc.length - 1];
    if (prev && prev.userId === tx.userId && prev.comment === tx.comment) {
      const newPrev = _.clone(prev);
      newPrev.amount += tx.amount;
      acc[acc.length - 1] = newPrev;
      return acc;
    }
  }

  // Not merged, so add it
  acc.push(tx);
  return acc;
}

const numTopDonations = 5;

function sortByAmountDesc(a, b) {
  const aAmount = a.amount;
  const bAmount = b.amount;
  if (aAmount === bAmount) {
    return a.id > b.id ? 1 : -1;
  } else {
    return aAmount > bAmount ? -1 : 1;
  }
}

function mergeDonationsByUser(dedupedDonations) {
  const donationsByUserId = {};
  for (const donation of dedupedDonations) {
    const d = donationsByUserId[donation.userId];
    if (!d) {
      donationsByUserId[donation.userId] = _.clone(donation);
      continue;
    }
    d.amount += donation.amount;
    if (donation.id > d.id && donation.comment) {
      d.comment = donation.comment;
    }
  }
  return _.values(donationsByUserId);
}

function getTopDonations(dedupedDonations) {
  return mergeDonationsByUser(dedupedDonations)
    .sort(sortByAmountDesc)
    .slice(0, numTopDonations);
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function calculateTournamentId() {
  if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.broadcaster) {
    const twitchContent =
      replaceAll(window.Twitch.ext.configuration.broadcaster.content, '"', '') || [];

    if (typeof twitchContent === 'string') {
      const stringArray = twitchContent.slice(1, -1);
      const finalArray = stringArray.split(',');
      return finalArray;
    }
    return twitchContent;
  }
  return [];
}

function getFirstTournamentId() {
  if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.broadcaster) {
    const twitchContent =
      replaceAll(window.Twitch.ext.configuration.broadcaster.content, '"', '') || [];

    if (typeof twitchContent === 'string') {
      const stringArray = twitchContent.slice(1, -1);
      const finalArray = stringArray.split(',');
      return finalArray[0];
    }
    return twitchContent;
  }
  return [];
}

class VideoComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOverlay: false,
      key: 'donors',
      bountyIds: calculateTournamentId(),
      bountyId: getFirstTournamentId(),
      // bountyIds: ['13060', '11112', '13104', '13106', '11111', '00001'],
      // bountyId: '13060',
      index: 0,
      bounty: {},
      bountyNotFoundError: '',
      activeTab: 'leaderboard',
      parentScreenHeight: window.innerHeight,
      headerImgScreenHeight: window.innerHeight / 3.88,
      tournamentDetailScreenHeight: window.innerHeight / 7.95,
      tabDataScreenHeight: window.innerHeight / 2,
      footerHeight: window.innerHeight / 14.3
    };
  }

  componentWillMount() {
    this.getDonation();
  }

  handleResize = () =>
    this.setState({
      parentScreenHeight: window.innerHeight,
      headerImgScreenHeight: window.innerHeight / 3.88,
      tournamentDetailScreenHeight: window.innerHeight / 7.95,
      tabDataScreenHeight: window.innerHeight / 2,
      footerHeight: window.innerHeight / 14.3
    });

  componentDidMount() {
    this.getDonationInterval = setInterval(this.getDonation, 10000);
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    clearInterval(this.getDonationInterval);
    window.removeEventListener('resize', this.handleResize);
  }

  getDonation = () => {
    const {bountyIds, bountyId} = this.state;
    if (bountyIds.length > 0 && bountyId !== '') {
      this.fetchData(this.state.bountyId);
    }
  };

  fetchData = bountyId => {
    let currentComponent = this;
    fetch('https://matcherino.com/__api/bounties/findById', {
      method: 'post',
      body: bountyId,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      // mode: 'cors',
      withCredentials: false
    })
      .then(function(u) {
        return u.json();
      })
      .then(function(val) {
        if (val.body) {
          currentComponent.setState({bounty: val.body, bountyNotFoundError: ''});
        }
      })
      .catch(function(err) {
        console.log('ERROR >>> ', err);
        currentComponent.setState({bountyNotFoundError: 'Tournament ID not found!'});
      });
  };

  minimize = () => {
    window.Twitch.ext.actions.minimize();
  };

  render() {
    const {
      bounty,
      bountyIds,
      bountyNotFoundError,
      bountyId,
      activeTab,
      index,
      footerHeight,
      headerImgScreenHeight,
      tabDataScreenHeight,
      tournamentDetailScreenHeight,
      parentScreenHeight
    } = this.state;
    const donations =
      bounty &&
      _(bounty.transactions)
        .filter(isTransactionDonation)
        .sortBy(sortByIdDesc)
        .reduce(mergeAndFilterDonationList, []);

    let topDonations;
    if (bounty.meta && bounty.meta.seedUsers) {
      const seedlings = bounty.meta.seedUsers.split(', ').map(x => {
        return x
          .replace(/^\s/, '')
          .replace(/\s$/, '')
          .toLowerCase();
      });
      const cleanDoners = _.filter(donations, d => {
        //adjusted filter to check for both UserId and Username
        const currentSeedList = bounty.meta.seedUsers.split(',').map(Number);
        const usernameSeed = seedlings.indexOf(d.userName.toLowerCase());
        const userIdSeed = currentSeedList.indexOf(d.userId);
        if (usernameSeed < 0 && userIdSeed < 0) {
          return d;
        }
      });
      topDonations = getTopDonations(cleanDoners);
    } else {
      topDonations = getTopDonations(donations);
    }
    return (
      <div className="container">
        <div className="row">
          <div className=" pull-right max-width">
            {!_.isEmpty(bounty) && !bountyNotFoundError && (
              <div className="col-6 bounty" style={{height: 'auto'}}>
                <div className="row img-container" style={{height: headerImgScreenHeight}}>
                  <img className="hero-image" src={bounty.meta.backgroundImg} alt=""/>
                  <div className="close-btn-container" onClick={this.minimize}>
                    <i className="close-icon icon-cancel-circled2" />
                  </div>
                </div>
                <div className="row">
                  <div
                    className="tournament-details"
                    style={{height: tournamentDetailScreenHeight}}
                  >
                    {bountyIds.length > 1 && (
                      <div className="page-indicator-container">
                        {bountyIds.map((bounty, i) => {
                          return (
                            <div
                              key={i}
                              className={`page-indicator ${i === index ? 'highlighted' : ''}`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {bountyIds.length > 1 && (
                      <div className="col-1 back-arrow" onClick={() => this.back(index)}>
                        &lt;
                      </div>
                    )}

                    <div className={bountyIds.length > 1 ? 'col-10' : 'col-12'}>
                      <div className="tournament-name">{bounty.title}</div>
                      <div className="tournament-prize">
                        {accounting.formatMoney(bounty.balance / 100)}
                      </div>
                    </div>
                    {bountyIds.length > 1 && (
                      <div className="col-1 next-arrow" onClick={() => this.next(index)}>
                        &gt;
                      </div>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div
                    className={`col-6 nav-tab ${activeTab === 'leaderboard' && 'active'}`}
                    onClick={() => this.setActiveTab('leaderboard')}
                  >
                    <span>Leaderboard</span>
                  </div>
                  <div
                    className={`col-6 nav-tab ${activeTab === 'donors' && 'active'}`}
                    onClick={() => this.setActiveTab('donors')}
                  >
                    <span>Supporters</span>
                  </div>
                </div>
                <div className="row">
                  <div className="tab-data" style={{height: tabDataScreenHeight}}>
                    {activeTab === 'donors' &&
                      donations.map((donation, index) => {
                        return this.renderDonor(donation, 'donors', index);
                      })}

                    {activeTab === 'leaderboard' &&
                      topDonations.map((donation, index) => {
                        return this.renderDonor(donation, 'leaderboard', index);
                      })}
                  </div>
                </div>
                <div className="row">
                  <div className="footer" style={{height: footerHeight}}>
                    <img className="rounded-circle" src={favicon} width="30" height="30" alt=""/>{' '}
                    <span className="footer-text">Powered by Matcherino</span>
                  </div>
                </div>
              </div>
            )}

            {bounty && bountyNotFoundError && (
              <div className="col-6 bounty-container" style={{height: parentScreenHeight}}>
                <div className="row bounty-error">
                  <div className="close-btn-container-error">
                    <span onClick={this.minimize}>
                      <i className="close-icon icon-cancel-circled2" />
                    </span>
                  </div>
                  <h3>Tournament ID {bountyId} not found.</h3>
                  {bountyIds.length > 1 && (
                    <div className="full-width">
                      <span>
                        <button
                          disabled={bountyIds[0] === bountyId}
                          className="btn btn-primary"
                          onClick={() => this.back(index)}
                        >
                          Back
                        </button>
                      </span>
                      &nbsp;
                      <span>
                        <button
                          disabled={bountyIds[bountyIds.length - 1] === bountyId}
                          className="btn btn-primary"
                          onClick={() => this.next(index)}
                        >
                          Next
                        </button>
                      </span>
                    </div>
                  )}
                </div>
                <div className="error-page footer" style={{height: footerHeight}}>
                  <img className="rounded-circle" src={favicon} width="30" height="30" alt=""/>{' '}
                  <span className="footer-text">Powered by Matcherino</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  setActiveTab = tab => {
    this.setState({activeTab: tab});
  };

  // show = () => {
  //   this.setState({showOverlay: true});
  // };

  // hide = () => {
  //   this.setState({showOverlay: false});
  // };

  back = index => {
    const {bountyIds, bountyId} = this.state;

    if (bountyIds[0] !== bountyId) {
      this.fetchData(bountyIds[index - 1]);
      this.setState({
        bounty: {},
        bountyId: bountyIds[index - 1],
        index: index - 1,
        bountyNotFoundError: ''
      });
    }
  };

  next = index => {
    const {bountyIds, bountyId} = this.state;

    if (bountyIds[bountyIds.length - 1] !== bountyId) {
      this.fetchData(bountyIds[index + 1]);
      this.setState({
        bounty: {},
        bountyId: bountyIds[index + 1],
        index: index + 1,
        bountyNotFoundError: ''
      });
    }
  };

  renderDonor(donor, type, index) {
    return (
      <div className="donor-container" key={donor.id}>
        <div className="row ">
          <div className="col-3">
            <div className="donor-details">
              <img
                className="donor-img rounded-circle"
                src={donor.avatar !== '' ? donor.avatar : defautlAvatr}
                height="70"
                width="70"
                alt=""
              />
            </div>
          </div>
          <div className="col-9">
            {donor.comment === '' && <br />}
            <div className="donor donor-details">
              <b>
                <span>{donor.displayName}</span>{' '}
                <span className="donation-amt">
                  {accounting.formatMoney(donor.amount / 100)}{' '}
                  {type === 'leaderboard' && (
                    <span>
                      <img className="star-img" src={images[index]} width="30" height="30" alt=""/>
                    </span>
                  )}
                </span>
              </b>
            </div>
            {donor.comment && <div className="donation-comment">{donor.comment}</div>}
          </div>
        </div>
      </div>
    );
  }
}

export default VideoComponent;
