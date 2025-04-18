using System.Management.Automation;
using System.Security.Cryptography;
using System.Text;

internal class Program
{
    private static void Main(string[] args)
    {
        HWIDGen.Start();
    }
}

public class HWIDGen
{
    public static void Start()
    {
        Console.WriteLine("[+] hwid: " + GenerateHWID());
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine("[!] press enter to exit");
        Console.ReadLine();
    }

    public static string GenerateHWID()
    {
        Console.ForegroundColor = ConsoleColor.DarkYellow;
        Console.WriteLine("[+] generating hwid please wait...");
        Console.ForegroundColor = ConsoleColor.Green;

        string param1,
            param2,
            param3,
            param4,
            param5,
            param6;

        param1 = WmicGetter("Win32_BIOS", "SerialNumber");
        param2 = WmicGetter("Win32_DiskDrive", "SerialNumber");
        param3 = WmicGetter("Win32_BaseBoard", "SerialNumber");
        param4 = WmicGetter("Win32_Processor", "ProcessorId");
        param5 = WmicGetter("Win32_ComputerSystem ", "SystemType");
        param6 = WmicGetter("Win32_OperatingSystem", "BuildNumber");

        string combinedParams = param1 + param2 + param3 + param4 + param5 + param6;

        using (SHA256 sha256Hash = SHA256.Create())
        {
            byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(combinedParams));

            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < bytes.Length; i++)
            {
                builder.Append(bytes[i].ToString("x2"));
            }
            return builder.ToString();
        }
    }

    public static string WmicGetter(string wmiClass, string wmiProperty)
    {
        using (PowerShell powerShell = PowerShell.Create())
        {
            powerShell
                .AddCommand("Get-WmiObject")
                .AddParameter("Class", wmiClass)
                .AddParameter("Property", wmiProperty);

            foreach (PSObject result in powerShell.Invoke())
            {
                return result.Members[wmiProperty].Value.ToString();
            }
            return String.Empty;
        }
    }
}
