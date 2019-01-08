import React from 'react';

class VideoFullscreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOverlay: false
    };
  }
  render() {
    const {showOverlay} = this.state;
    return (
      <div style={{marginTop: '100px', width: '700px'}} className="container">
        <div className="row">
          <div className="col-2" style={{marginTop: '200px'}}>
            <button>
              <img
                className="rounded-circle"
                src="https://matcherino.com/wp-content/uploads/2016/04/helmet-400x400.png"
                width="50"
                height="50"
                onClick={this.show}
              />
            </button>
          </div>
          <div
            className="col-4"
            style={{
              height: '400px',
              display: showOverlay ? 'block' : 'none',
              backgroundColor: 'white',
              marginLeft: '100px',
              marginTop: '-250px'
            }}
          >
            {showOverlay && (
              <div style={{float: 'right'}}>
                <a onClick={this.hide} style={{cursor: 'default'}}>
                  X
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  show = () => {
    this.setState({showOverlay: true});
  };

  hide = () => {
    this.setState({showOverlay: false});
  };
}

export default VideoFullscreen;
