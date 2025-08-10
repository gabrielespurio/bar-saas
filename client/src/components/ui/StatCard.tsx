interface StatCardProps {
  icon: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export default function StatCard({
  icon,
  iconColor,
  title,
  value,
  subtitle,
  trend,
  trendValue,
}: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "fas fa-arrow-up";
      case "down":
        return "fas fa-arrow-down";
      default:
        return "fas fa-minus";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-danger";
      default:
        return "text-muted";
    }
  };

  return (
    <div className="card stat-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className={`bg-${iconColor} bg-opacity-10 rounded-circle p-3 me-3`}>
            <i className={`${icon} text-${iconColor} fa-lg`}></i>
          </div>
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            <h4 className="fw-bold mb-0">{value}</h4>
            {(subtitle || trend) && (
              <small className={trend ? getTrendColor() : "text-muted"}>
                {trend && trendValue && (
                  <>
                    <i className={getTrendIcon()}></i> {trendValue}
                  </>
                )}
                {subtitle && !trend && subtitle}
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
