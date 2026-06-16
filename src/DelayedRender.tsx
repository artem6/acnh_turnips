import * as React from "react";

interface DelayedRenderProps {
  width: string | number;
  height: string | number;
  delay?: number;
  unmountOnHidden?: boolean;
}
interface DelayedRenderState {
  visible: boolean;
}
class DelayedRender extends React.PureComponent<
  DelayedRenderProps,
  DelayedRenderState
> {
  containerRef: React.RefObject<any>;
  observer: IntersectionObserver | null = null;
  state = {
    visible: false,
  };
  constructor(props: DelayedRenderProps) {
    super(props);
    this.containerRef = React.createRef();
  }
  visibleTimeout: NodeJS.Timeout | null = null;
  observeHandler = (entries: IntersectionObserverEntry[]) => {
    try {
      if (this.visibleTimeout) clearTimeout(this.visibleTimeout);
      if (entries[0].isIntersecting && !this.state.visible) {
        this.visibleTimeout = setTimeout(() => {
          this.setState({ visible: true });
          if (!this.props.unmountOnHidden) {
            this.observer && this.observer.unobserve(this.containerRef.current);
          }
        }, this.props.delay || 0);
      } else if (
        this.props.unmountOnHidden &&
        !entries[0].isIntersecting &&
        this.state.visible
      ) {
        this.setState({ visible: false });
      }
    } catch (e) {
      this.setState({ visible: true });
    }
  };
  componentDidMount() {
    try {
      this.observer = new IntersectionObserver(this.observeHandler);
      this.observer.observe(this.containerRef.current);
    } catch (e) {
      this.setState({ visible: true });
    }
  }
  componentWillUnmount() {
    try {
      if (this.visibleTimeout) clearTimeout(this.visibleTimeout);
      this.observer && this.observer.unobserve(this.containerRef.current);
      this.observer = null;
    } catch (e) {}
  }
  render() {
    const { width, height, children, ...props } = this.props;
    return (
      <div
        style={{
          minWidth: width,
          minHeight: height,
          display: "inline-block",
        }}
        ref={this.containerRef}
        {...props}
      >
        {this.state.visible ? children : null}
      </div>
    );
  }
}

export default DelayedRender;
