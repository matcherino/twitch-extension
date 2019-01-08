import React from 'react';
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function calculateTournamentId() {
  if (window.Twitch.ext.configuration && window.Twitch.ext.configuration.broadcaster) {
    const twitchContent = replaceAll(
      window.Twitch.ext.configuration.broadcaster.content,
      '"',
      ''
    ) || [''];
    // const twitchContent = '[13106,13104,11110]';

    if (typeof twitchContent === 'string') {
      const stringArray = twitchContent.slice(1, -1);
      const finalArray = stringArray.split(',');
      return finalArray;
    }
    return twitchContent;
  }
  return [''];
}

class Config extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tournamentId: calculateTournamentId(),
      // tournamentId: ['13106', '13104', '11111'],
      isAuthorized: false,
      authorization: {}
    };
    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
  }

  componentDidMount() {
    this.twitch.onAuthorized(auth => {
      this.setState(() => {
        return {
          isAuthorized: false,
          authorization: auth
        };
      });
    });
    this.twitch.configuration.onChanged(() => {
      let config = this.twitch.configuration.broadcaster
        ? this.twitch.configuration.broadcaster.content || ''
        : [];
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = [];
      }

      this.setState(() => {
        return {
          commands: config
        };
      });
    });
  }

  onTextChange = (e, index) => {
    const {tournamentId} = this.state;
    tournamentId[index] = e.target.value;
    this.setState({tournamentId});
  };

  saveConfig = commands => {
    window.Twitch && this.twitch.configuration.set('broadcaster', '1.0', JSON.stringify(commands));

    this.setState(prevState => {
      return {
        commands
      };
    });

    toast.success('Tournament ID has been successfully saved.', {
      position: toast.POSITION.TOP_RIGHT
    });
  };

  addNewInput = () => {
    const {tournamentId} = this.state;
    tournamentId.push('');

    this.setState({tournamentId});
  };

  removeInput = index => {
    const {tournamentId} = this.state;
    tournamentId.splice(index, 1);

    this.setState({tournamentId});
  };

  render() {
    const {tournamentId} = this.state;

    return (
      <div>
        <br />
        <div className="row">
          <div className="col-3">
            <label>
              <b style={{fontSize: '24px'}}>
                Tournament ID:{' '}
                <button type="button" className="btn btn-info" onClick={this.addNewInput}>
                  +
                </button>{' '}
              </b>
            </label>
            &nbsp;
            {tournamentId.map((id, index) => {
              return (
                <div className="form-group">
                  <form className="form-inline" key={index}>
                    <input
                      type="text"
                      className="form-control"
                      id="tournamentId"
                      value={replaceAll(id, '"', '')}
                      placeholder="11110"
                      onChange={e => this.onTextChange(e, index)}
                    />
                    &nbsp;
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => this.removeInput(index)}
                    >
                      -
                    </button>
                  </form>
                </div>
              );
            })}
            <br />
            <button
              type="button"
              className="btn btn-primary float-right"
              style={{marginRight: '25px'}}
              onClick={() => this.saveConfig(tournamentId)}
            >
              {' '}
              Save
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }
}

export default Config;
