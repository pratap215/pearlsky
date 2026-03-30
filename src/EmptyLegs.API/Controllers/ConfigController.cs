using Microsoft.AspNetCore.Mvc;

namespace EmptyLegs.API.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _config;

    public ConfigController(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>GET api/config/app — Returns public app configuration</summary>
    [HttpGet("app")]
    public IActionResult GetAppConfig()
    {
        return Ok(new
        {
            paymentMode = _config["Payment:Mode"] ?? "Gateway",
            appName = "JetFlux",
            appVersion = "1.0.0"
        });
    }
}
