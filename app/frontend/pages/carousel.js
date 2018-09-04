import React, { Component } from 'react';
import styled from 'styled-components';

const CarouselContainer = styled.div`
  display: flex;
  margin: 0 0 20px 20px;
  transition: ${props => (props.sliding ? 'none' : 'transform 1s ease')};
`;

const Wrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

const CarouselSlot = styled.div`
  flex: 0 0 100%;
  flex-basis: 32%;
  margin-right: 20px;
  order: ${props => props.order};
  opacity: ${props => {
    if (props.numSlides === 1) return 1;
    if (props.numSlides === 2) return props.order === props.position ? 1 : 0.5;
    return props.order === 1 ? 1 : 0.5;
  }};
  transition: opacity 1s ease;
`;

class Carousel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: this.props.initialPosition || 0,
      direction: this.props.children.length === 2 ? 'prev' : 'next',
      sliding: false,
    };
  }

  getOrder(itemIndex) {
    const { position } = this.state;
    const { children } = this.props;
    const numItems = children.length;

    if (numItems === 2) return itemIndex;

    if (itemIndex - position < 0)
      return numItems - Math.abs(itemIndex - position);
    return itemIndex - position;
  }

  nextSlide = () => {
    const { position } = this.state;
    const { children } = this.props;
    const numItems = children.length;

    if (numItems === 2 && position === 1) return;
    if (position === numItems - 3) return;
    this.doSliding('next', position + 1);
  };

  prevSlide = () => {
    const { position } = this.state;
    const { children } = this.props;
    const numItems = children.length;

    if (numItems === 2 && position === 0) return;
    if (position === -1) return;

    this.doSliding('prev', position - 1);
  };

  doSliding = (direction, position) => {
    this.setState({
      sliding: true,
      direction,
      position,
    });

    setTimeout(() => {
      this.setState({
        sliding: false,
      });
    }, 50);
  };

  render() {
    const { title, children } = this.props;

    return (
      <div>
        <h2>{title}</h2>
        <Wrapper>
          <CarouselContainer
            sliding={this.state.sliding}
            direction={this.state.direction}
          >
            {children.map((child, index) => (
              <CarouselSlot key={index} order={this.getOrder(index)}>
                {child}
              </CarouselSlot>
            ))}
          </CarouselContainer>
        </Wrapper>
        <div className="has-text-centered">
          <button
            className="button"
            disabled={this.state.position === -1 ? true : false}
            onClick={() => this.prevSlide()}
          >
            <span className="icon">
              <i className="fa fa-arrow-left" />
            </span>
            <span>Anterior</span>
          </button>
          <button
            className="button"
            disabled={
              this.state.position === children.length - 3 ? true : false
            }
            onClick={() => this.nextSlide()}
          >
            <span>Siguiente</span>
            <span className="icon">
              <i className="fa fa-arrow-right" />
            </span>
          </button>
        </div>
      </div>
    );
  }
}

export default Carousel;
